"use client";

import type { UploadProgressEvent } from "@/app/api/upload/route";

type Stage = UploadProgressEvent["stage"];

const STAGE_ORDER: Stage[] = ["receiving", "extracting", "analysing", "creating", "done"];

const STAGE_LABELS: Record<Stage, string> = {
  receiving: "Receiving file",
  extracting: "Extracting text",
  analysing: "AI analysis",
  creating: "Building world",
  done: "Complete",
  error: "Error",
};

interface Props {
  stage: Stage;
  message: string;
}

export function UploadProgress({ stage, message }: Props) {
  if (stage === "error") {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-xl border p-6 text-center"
        style={{ borderColor: "var(--danger)", backgroundColor: "var(--surface)" }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--danger)" }}>
          Upload failed
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {message}
        </p>
      </div>
    );
  }

  const currentIdx = STAGE_ORDER.indexOf(stage);

  return (
    <div
      aria-live="polite"
      aria-label={`Upload progress: ${message}`}
      className="rounded-xl border p-6"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      {/* Step indicators */}
      <ol aria-label="Upload stages" className="mb-6 flex items-center gap-2">
        {STAGE_ORDER.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={s} className="flex flex-1 flex-col items-center gap-1">
              <div
                aria-current={active ? "step" : undefined}
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors"
                style={{
                  backgroundColor: done
                    ? "var(--success)"
                    : active
                    ? "var(--accent)"
                    : "var(--surface-2)",
                  color: done || active ? "#fff" : "var(--text-muted)",
                }}
              >
                {done ? (
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className="hidden text-xs sm:block"
                style={{ color: active ? "var(--text)" : "var(--text-muted)" }}
              >
                {STAGE_LABELS[s]}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Current message */}
      <div className="text-center">
        {stage !== "done" && (
          <div
            aria-hidden="true"
            className="mx-auto mb-3 h-1 w-32 overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--surface-2)" }}
          >
            <div
              className="h-full rounded-full animate-shimmer"
              style={{
                width: "60%",
                background: `linear-gradient(90deg, var(--accent-dim) 25%, var(--accent) 50%, var(--accent-dim) 75%)`,
                backgroundSize: "200% 100%",
              }}
            />
          </div>
        )}
        <p
          role="status"
          aria-live="polite"
          className="text-sm"
          style={{ color: stage === "done" ? "var(--success)" : "var(--text-muted)" }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
