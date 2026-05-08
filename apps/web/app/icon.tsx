import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 22,
          fontWeight: 800,
          borderRadius: 6,
        }}
      >
        E
      </div>
    ),
    { ...size }
  );
}
