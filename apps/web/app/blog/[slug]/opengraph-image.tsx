import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "EchoQuest blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

export default async function BlogOgImage({ params }: Props) {
  const { slug } = await params;
  let post: { title: string; excerpt: string } | null = null;
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { title: true, excerpt: true },
    });
  } catch {
    // Fall through to generic
  }

  const title = post?.title ?? "EchoQuest";
  const excerpt = post?.excerpt ?? "Audio-first interactive storytelling";

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
