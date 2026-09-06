"use client";

import { useEffect, useRef, useState } from "react";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import type { Priority } from "@/lib/planner/planner-context";

export function TodoModal({
  open,
  isEdit,
  initialText,
  initialPriority,
  onCancel,
  onSave,
  onDelete,
}: {
  open: boolean;
  isEdit: boolean;
  initialText: string;
  initialPriority: Priority;
  onCancel: () => void;
  onSave: (text: string, priority: Priority) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(initialText);
  const [priority, setPriority] = useState<Priority>(initialPriority);
  const inputRef = useRef<HTMLInputElement>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setText(initialText);
      setPriority(initialPriority);
    }
  }

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

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
          width: 400,
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
            style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text)", fontStyle: "italic" }}
          >
            {isEdit ? "Edit Task" : "Add Task"}
          </div>
          <button className="close-btn" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
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
              Task
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="What needs to be done?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSave(text, priority)}
              style={{
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
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
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
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              style={{
                padding: "8px 12px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontFamily: "var(--font-ui)",
                fontSize: "0.85rem",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              <option value="high">🔴 High</option>
              <option value="med">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            padding: "14px 20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {isEdit ? (
            <button className="btn" style={{ color: "var(--danger)", border: "1px solid var(--danger)" }} onClick={onDelete}>
              🗑 Delete
            </button>
          ) : (
            <div />
          )}
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <button className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={() => onSave(text, priority)}>
              {isEdit ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
