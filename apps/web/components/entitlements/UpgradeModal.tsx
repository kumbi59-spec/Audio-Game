"use client";

import { useEffect, useRef } from "react";
import { PRICING, TIER_HIGHLIGHTS } from "@audio-rpg/shared";

interface UpgradeModalProps {
  open: boolean;
  requiredTier: "storyteller" | "creator";
  featureName: string;
  onClose: () => void;
}

export function UpgradeModal({ open, requiredTier, featureName, onClose }: UpgradeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = "upgrade-modal-heading";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      headingRef.current?.focus();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleCancel(e: Event) {
      e.preventDefault();
      onClose();
    }
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const pricing = PRICING[requiredTier];
  const highlights = TIER_HIGHLIGHTS[requiredTier];
  const tierLabel = requiredTier === "storyteller" ? "Storyteller" : "Creator";

  function handleUpgrade() {
    window.open(`/api/payments/checkout?tier=${requiredTier}`, "_blank");
    onClose();
  }


  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={headingId}
      style={{
        border: "none",
        padding: 0,
        background: "transparent",
        maxWidth: "480px",
        width: "100%",
        outline: "none",
      }}
    >
      <style>{`
        dialog::backdrop {
          background: rgba(0, 0, 0, 0.7);
        }
        dialog[open] {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "1rem",
          padding: "1.5rem",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--text)",
            margin: 0,
            outline: "none",
          }}
        >
          Unlock {featureName}
        </h2>

        <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-muted)" }}>
          Available on the{" "}
          <span style={{ color: "var(--accent)", fontWeight: 700 }}>{tierLabel}</span> plan
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "baseline",
              gap: "2px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              padding: "0.75rem",
            }}
          >
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)" }}>
              ${pricing.monthly}
            </span>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>/month</span>
          </div>

          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>or</span>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "baseline",
              gap: "2px",
              background: "var(--accent-bg)",
              border: "1px solid var(--accent)",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              position: "relative",
            }}
          >
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent)" }}>
              ${pricing.annual}
            </span>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>/year</span>
            <span
              style={{
                position: "absolute",
                top: "-10px",
                right: "8px",
                background: "var(--accent)",
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                borderRadius: "0.25rem",
                padding: "1px 6px",
              }}
            >
              Save 30%
            </span>
          </div>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--text-muted)",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
          }}
        >
          What&apos;s included
        </p>

        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {highlights.map((item) => (
            <li key={item} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <span aria-hidden="true" style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>
                ✓
              </span>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {item}
              </span>
            </li>
          ))}
        </ul>

        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
          All accessibility features are always free.
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            style={{
              flex: 2,
              padding: "0.75rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: "0.9375rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Upgrade to {tierLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
