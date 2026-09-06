"use client";

import { useEffect, useRef, useState } from "react";
import { useEscapeToClose } from "@/lib/useEscapeToClose";

export function PromptModal({
  open,
  title,
  label,
  placeholder,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  label: string;
  placeholder: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setValue("");
  }

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEscapeToClose(open, onCancel);
  if (!open) return null;

  function submit() {
    if (!value.trim()) return;
    onConfirm(value);
  }

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
          width: 380,
          maxWidth: "94vw",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--text)",
              fontStyle: "italic",
            }}
          >
            {title}
          </div>
          <button className="close-btn" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div style={{ padding: "18px 20px" }}>
          <label
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "var(--text3)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {label}
          </label>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "8px 12px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontFamily: "var(--font-ui)",
              fontSize: "0.85rem",
              color: "var(--text)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "14px 20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
