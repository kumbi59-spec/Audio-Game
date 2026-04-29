import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { extractText, MAX_FILE_BYTES } from "@/lib/upload/file-router";
import { parseGameBible, createWorldFromBible } from "@/lib/ai/bible-parser";
import { ensureGuestUser } from "@/lib/db/queries/users";
import type { UploadProgressEvent } from "@/lib/upload/types";

function sse(event: UploadProgressEvent): string {
  return `event: progress\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: UploadProgressEvent) {
        controller.enqueue(encoder.encode(sse(event)));
      }

      let file: File | null = null;
      let guestId: string | null = null;

      try {
        send({ stage: "receiving", message: "Receiving your file…" });

        const [formData, session] = await Promise.all([req.formData(), auth()]);
        file = formData.get("file") as File | null;
        guestId = formData.get("guestId") as string | null;

        if (!file) {
          send({ stage: "error", message: "No file received. Please select a file and try again." });
          return;
        }
        if (!guestId) {
          send({ stage: "error", message: "Missing guest ID." });
          return;
        }

        // Use the authenticated user's ID as owner so they can play the world after upload
        const ownerId = session?.user?.id ?? guestId;
        if (file.size > MAX_FILE_BYTES) {
          send({ stage: "error", message: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.` });
          return;
        }

        send({ stage: "extracting", message: "Extracting text from your file…" });

        const buffer = Buffer.from(await file.arrayBuffer());
        let rawText: string;
        try {
          rawText = await extractText(buffer, file.type, file.name);
        } catch (err) {
          send({
            stage: "error",
            message: `Could not read file: ${err instanceof Error ? err.message : "unknown error"}. Try saving as plain text or PDF.`,
          });
          return;
        }

        if (rawText.length < 20) {
          send({ stage: "error", message: "The file appears to be empty or contains no readable text." });
          return;
        }

        try {
          await ensureGuestUser(ownerId);
        } catch {
          send({ stage: "error", message: "Could not establish your user account. Please refresh and try again." });
          return;
        }

        send({ stage: "analysing", message: "The AI is reading your world — this takes about 15 seconds…" });

        let bible;
        try {
          bible = await parseGameBible(rawText);
        } catch (err) {
          send({
            stage: "error",
            message: err instanceof Error ? err.message : "AI extraction failed. Check your file and try again.",
          });
          return;
        }

        send({ stage: "creating", message: `Building "${bible.worldName}"…` });

        let worldId: string;
        try {
          worldId = await createWorldFromBible(
            bible,
            ownerId,
            rawText,
            file.name,
            file.type || "text/plain"
          );
        } catch (err) {
          send({
            stage: "error",
            message: `Could not save your world: ${err instanceof Error ? err.message : "database error"}`,
          });
          return;
        }

        send({
          stage: "done",
          message: `Your world "${bible.worldName}" is ready to play!`,
          worldId,
          worldName: bible.worldName,
        });
      } catch (err) {
        send({
          stage: "error",
          message: err instanceof Error ? err.message : "An unexpected error occurred.",
        });
      } finally {
        controller.close();
      }
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

