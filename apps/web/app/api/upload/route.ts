import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { limitAuthoringRequest } from "@/lib/ai/usage-guard";
import { extractText, MAX_FILE_BYTES } from "@/lib/upload/file-router";
import { UploadParseError } from "@/lib/upload/guards";
import { parseGameBible, createWorldFromBible } from "@/lib/ai/bible-parser";
import { getUserTier } from "@/lib/db/queries/users";
import { prisma } from "@/lib/db";
import { recordUploadAuditEvent } from "@/lib/db/queries/upload-audit";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";
import type { UploadProgressEvent } from "@/lib/upload/types";
import { UploadParseErrorCode } from "@/lib/upload/guards";

// Room for the multipart boundaries and part headers around the file itself.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

function sse(event: UploadProgressEvent): string {
  return `event: progress\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  // Set once the client has gone away (or the stream is finished); enqueue
  // and close throw after that, which would abort the world being built.
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: UploadProgressEvent) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(sse(event)));
        } catch {
          closed = true;
        }
      }

      let file: File | null = null;
      let gameBibleId: string | null = null;

      // Gives the bible a terminal "failed" status on the paths that stop
      // without one, leaving an already-terminal status alone.
      async function markFailed(errorMessage: string) {
        if (!gameBibleId) return;
        await prisma.gameBible
          .updateMany({
            where: { id: gameBibleId, processingStatus: { notIn: ["failed", "quarantine", "complete"] } },
            data: { processingStatus: "failed", errorMessage },
          })
          .catch((err: unknown) => console.error("[upload] could not mark bible failed:", err));
      }

      try {
        send({ stage: "receiving", message: "Receiving your file…" });

        // Who's asking is checked before the body is read, so an anonymous or
        // oversized request is never buffered.
        const session = await auth();
        // Parsing a bible is an AI call and uploads are a paid-tier feature, so
        // anonymous callers are rejected rather than attributed to a
        // client-supplied guest id (which could name any account).
        if (!session?.user?.id) {
          send({ stage: "error", message: "Sign in to upload a game bible." });
          return;
        }

        const ownerId = session.user.id;

        const limited = await limitAuthoringRequest(req, {
          id: ownerId,
          isAdmin: (session.user as { isAdmin?: boolean }).isAdmin === true,
        });
        if (limited) {
          const { message } = (await limited.json()) as { message?: string };
          send({ stage: "error", message: message ?? "Too many requests. Please wait a moment and try again." });
          return;
        }

        // Enforce maxWorlds tier limit
        {
          const tier = await getUserTier(ownerId);
          const { maxWorlds } = TIER_ENTITLEMENTS[tier as keyof typeof TIER_ENTITLEMENTS] ?? TIER_ENTITLEMENTS.free;
          if (maxWorlds !== null && maxWorlds === 0) {
            send({ stage: "error", message: "Upgrade to the Storyteller plan to create custom worlds." });
            return;
          }
          if (maxWorlds !== null) {
            const worldCount = await prisma.world.count({ where: { ownerId, isPrebuilt: false } });
            if (worldCount >= maxWorlds) {
              send({ stage: "error", message: `You've reached your world limit (${maxWorlds}). Upgrade to Creator for unlimited worlds.` });
              return;
            }
          }
        }

        const declaredLength = Number(req.headers.get("content-length") ?? "");
        if (declaredLength > MAX_FILE_BYTES + MULTIPART_OVERHEAD_BYTES) {
          send({ stage: "error", message: "File is too large. Maximum is 10 MB." });
          return;
        }

        const formData = await req.formData();
        file = formData.get("file") as File | null;

        if (!file) {
          send({ stage: "error", message: "No file received. Please select a file and try again." });
          return;
        }

        if (file.size > MAX_FILE_BYTES) {
          send({ stage: "error", message: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.` });
          return;
        }

        send({ stage: "extracting", message: "Extracting text from your file…" });

        const buffer = Buffer.from(await file.arrayBuffer());
        const gameBible = await prisma.gameBible.create({
          data: {
            originalName: file.name,
            mimeType: file.type || "application/octet-stream",
            rawText: "",
            parsedData: "",
            processingStatus: "uploaded",
            uploaderId: ownerId,
          },
        });
        gameBibleId = gameBible.id;
        await prisma.gameBible.update({
          where: { id: gameBibleId },
          data: { processingStatus: "sniff_validating" },
        });

        let rawText: string;
        try {
          rawText = await extractText(buffer, file.type, file.name);
          await prisma.gameBible.update({
            where: { id: gameBibleId },
            data: { processingStatus: "parsed", rawText: rawText.slice(0, 200_000) },
          });
        } catch (err) {
          const parseCode = err instanceof UploadParseError ? err.code : "unknown";
          const shouldQuarantine = [
            UploadParseErrorCode.ContentSniffMismatch,
            UploadParseErrorCode.ParserFailed,
            UploadParseErrorCode.ParserMemoryLimit,
            UploadParseErrorCode.ParserTimeout,
          ].includes(parseCode as UploadParseErrorCode);

          if (shouldQuarantine) {
            if (gameBibleId) {
              await prisma.gameBible.update({
                where: { id: gameBibleId },
                data: {
                  processingStatus: "quarantine",
                  errorMessage: err instanceof Error ? err.message : String(err),
                },
              });
            }
            await recordUploadAuditEvent({
              uploaderId: ownerId,
              gameBibleId,
              action: "quarantined",
              reasonCode: String(parseCode),
              metadata: { filename: file.name, mimeType: file.type, size: file.size },
            });
            console.warn("[upload] quarantined", { gameBibleId, reasonCode: parseCode, filename: file.name });
          } else {
            if (gameBibleId) {
              await prisma.gameBible.update({
                where: { id: gameBibleId },
                data: {
                  processingStatus: "failed",
                  errorMessage: err instanceof Error ? err.message : String(err),
                },
              });
            }
            await recordUploadAuditEvent({
              uploaderId: ownerId,
              gameBibleId,
              action: "rejected",
              reasonCode: String(parseCode),
              metadata: { filename: file.name, mimeType: file.type, size: file.size },
            });
          }
          const safeMessage =
            err instanceof UploadParseError
              ? err.userMessage
              : "Could not read this file. Try saving as plain text, PDF, or DOCX and upload again.";

          send({
            stage: "error",
            message: safeMessage,
          });
          return;
        }

        if (rawText.length < 20) {
          await markFailed("no readable text");
          send({ stage: "error", message: "The file appears to be empty or contains no readable text." });
          return;
        }

        send({ stage: "analysing", message: "The AI is reading your world — this takes about 15 seconds…" });
        await prisma.gameBible.update({
          where: { id: gameBibleId! },
          data: { processingStatus: "ai_transforming" },
        });

        // Send keep-alive pings so the proxy doesn't time out during the AI call
        const keepAlive = setInterval(() => {
          send({ stage: "analysing", message: "The AI is reading your world — this takes about 15 seconds…" });
        }, 10_000);

        let bible;
        try {
          bible = await parseGameBible(rawText);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await prisma.gameBible.update({
            where: { id: gameBibleId! },
            data: {
              processingStatus: "failed",
              errorMessage: msg,
            },
          });
          console.error("[upload] parseGameBible failed:", msg);
          send({
            stage: "error",
            message: `AI extraction failed: ${msg}`,
          });
          return;
        } finally {
          clearInterval(keepAlive);
        }

        send({ stage: "creating", message: `Building "${bible.worldName}"…` });
        await prisma.gameBible.update({
          where: { id: gameBibleId! },
          data: { processingStatus: "publishing", parsedData: JSON.stringify(bible) },
        });

        let worldId: string;
        try {
          worldId = await createWorldFromBible(
            bible,
            ownerId,
            gameBibleId!
          );
        } catch (err) {
          await prisma.gameBible.update({
            where: { id: gameBibleId! },
            data: {
              processingStatus: "failed",
              errorMessage: err instanceof Error ? err.message : "database error",
            },
          });
          send({
            stage: "error",
            message: `Could not save your world: ${err instanceof Error ? err.message : "database error"}`,
          });
          return;
        }
        await recordUploadAuditEvent({
          uploaderId: ownerId,
          gameBibleId,
          action: "accepted",
          reasonCode: "world_created",
          metadata: { worldId, filename: file.name, mimeType: file.type, size: file.size },
        });
        console.info("[upload] accepted", { ownerId, worldId, filename: file.name });
        await prisma.gameBible.update({
          where: { id: gameBibleId! },
          data: { processingStatus: "complete" },
        });

        send({
          stage: "done",
          message: `Your world "${bible.worldName}" is ready to play!`,
          worldId,
          worldName: bible.worldName,
        });
      } catch (err) {
        await markFailed(err instanceof Error ? err.message : String(err));
        send({
          stage: "error",
          message: err instanceof Error ? err.message : "An unexpected error occurred.",
        });
      } finally {
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            // Already closed by a client disconnect.
          }
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
