"use client";

import { useEscapeToClose } from "@/lib/useEscapeToClose";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEscapeToClose(open, onCancel);
  if (!open) return null;

  return (
    <div
      style={{
        display: "flex",
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.55)",
        zIndex: 300,
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          width: 360,
          maxWidth: "94vw",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ padding: "24px 24px 16px" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text)",
              fontStyle: "italic",
              marginBottom: 8,
            }}
          >
            {title}
          </div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--text2)", lineHeight: 1.6 }}>
            {message}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "14px 24px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn" style={{ background: "var(--danger)", color: "#fff" }} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
