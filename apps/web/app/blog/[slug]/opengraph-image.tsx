import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "EchoQuest blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

export default async function BlogOgImage({ params }: Props) {
  const { slug } = await params;
  let post: { title: string; excerpt: string; coverImageUrl: string | null } | null = null;
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { title: true, excerpt: true, coverImageUrl: true },
    });
  } catch {
    // Fall through to generic
  }

  const title = post?.title ?? "EchoQuest";
  const excerpt = post?.excerpt ?? "Audio-first interactive storytelling";

  // When a BFL-generated cover exists, render it edge-to-edge with a dark
  // bottom gradient and the title overlaid — the share card and the page
  // hero feel like the same artwork. Otherwise fall back to the original
  // branded card so posts without covers still get an OG image.
  if (post?.coverImageUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            position: "relative",
            width: "1200px",
            height: "630px",
            display: "flex",
            fontFamily: "sans-serif",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- satori needs a literal <img> */}
          <img
            src={post.coverImageUrl}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              width: "1200px",
              height: "630px",
              objectFit: "cover",
            }}
          />
          {/* Dark gradient at the bottom so the white title stays legible
              regardless of what the model drew underneath. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              background:
                "linear-gradient(180deg, rgba(15,12,26,0.05) 0%, rgba(15,12,26,0.0) 40%, rgba(15,12,26,0.85) 100%)",
              padding: "60px 72px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#c4b5fd",
                fontSize: 22,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 28 }}>🎙</span>
              EchoQuest Blog
            </div>
            <div
              style={{
                fontSize: 58,
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.1,
                letterSpacing: "-1.5px",
                textShadow: "0 4px 24px rgba(0,0,0,0.85)",
                maxWidth: 1056,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 22,
                color: "#e5d8ff",
                lineHeight: 1.4,
                marginTop: 16,
                opacity: 0.92,
                maxWidth: 1056,
                textShadow: "0 2px 10px rgba(0,0,0,0.7)",
              }}
            >
              {excerpt.length > 160 ? `${excerpt.slice(0, 157)}...` : excerpt}
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
  }

  // Fallback branded card (no cover generated yet)
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0f0c1a 0%, #1a1035 50%, #0f0c1a 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#a78bfa", fontSize: 24, fontWeight: 600 }}>
          <span style={{ fontSize: 32 }}>🎙</span>
          EchoQuest Blog
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 60,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              textShadow: "0 0 40px rgba(124,106,247,0.4)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#c4b5fd",
              lineHeight: 1.4,
              maxWidth: 980,
              opacity: 0.85,
            }}
          >
            {excerpt.length > 180 ? `${excerpt.slice(0, 177)}...` : excerpt}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 18,
            color: "#7c6af7",
            fontWeight: 500,
          }}
        >
          echoquest.app
        </div>
      </div>
    ),
    { ...size }
  );
}
