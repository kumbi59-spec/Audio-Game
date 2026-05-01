import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EchoQuest — Narrated AI RPG Adventures";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0c1a 0%, #1a1035 50%, #0f0c1a 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,106,247,0.25) 0%, transparent 70%)",
            top: "-100px",
            left: "300px",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            fontSize: "72px",
            marginBottom: "24px",
            filter: "drop-shadow(0 0 24px rgba(124,106,247,0.8))",
          }}
        >
          🎙
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "800",
            color: "#ffffff",
            letterSpacing: "-2px",
            textAlign: "center",
            lineHeight: 1.1,
            textShadow: "0 0 40px rgba(124,106,247,0.6)",
          }}
        >
          EchoQuest
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "#a78bfa",
            marginTop: "16px",
            fontWeight: "400",
            textAlign: "center",
            letterSpacing: "0.5px",
          }}
        >
          Narrated AI RPG Adventures
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: "20px",
            color: "#7c6af7",
            marginTop: "12px",
            fontWeight: "300",
            textAlign: "center",
            opacity: 0.8,
          }}
        >
          Audio-first · AI Game Master · Fully Accessible
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(124,106,247,0.15)",
            border: "1px solid rgba(124,106,247,0.4)",
            borderRadius: "100px",
            padding: "8px 24px",
            color: "#c4b5fd",
            fontSize: "18px",
          }}
        >
          Free to start · echoquest.app
        </div>
      </div>
    ),
    { ...size }
  );
}
