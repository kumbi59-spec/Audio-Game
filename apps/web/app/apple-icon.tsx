import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1035 0%, #7c6af7 100%)",
          color: "#ffffff",
          fontSize: 110,
          fontWeight: 800,
        }}
      >
        E
      </div>
    ),
    { ...size }
  );
}
