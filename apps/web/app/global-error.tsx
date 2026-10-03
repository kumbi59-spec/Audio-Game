"use client";

/**
 * Last-resort page for an error in the root layout itself, so it renders its
 * own document and can't rely on the app's styles or components.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", background: "#080b12", color: "#e8e6f0", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>EchoQuest hit a snag</h1>
          <p style={{ color: "#8b8fa8", marginTop: 12 }}>The page couldn&apos;t load. Try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 32, minHeight: 44, padding: "0 20px", borderRadius: 8, border: 0, background: "#7261e3", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
