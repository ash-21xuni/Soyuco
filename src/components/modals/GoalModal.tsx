"use client";

import { useState } from "react";
import { useEscapeToClose } from "@/lib/useEscapeToClose";

const fieldLabel: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "var(--text3)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};
const fieldInput: React.CSSProperties = {
  padding: "8px 12px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontFamily: "var(--font-ui)",
  fontSize: "0.85rem",
  color: "var(--text)",
};

export function GoalModal({
  open,
  onCancel,
  onSave,
}: {
  open: boolean;
  onCancel: () => void;
  onSave: (fields: { name: string; target: number; saved: number }) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setTarget("");
      setSaved("");
    }
  }

  useEscapeToClose(open, onCancel);
  if (!open) return null;

  function submit() {
    const t = parseFloat(target);
    const s = parseFloat(saved) || 0;
    if (!name.trim() || isNaN(t) || t <= 0) {
      alert("Please enter a goal name and target amount.");
      return;
    }
    onSave({ name: name.trim(), target: t, saved: s });
  }

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.55)", zIndex: 300, alignItems: "center", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", width: 380, maxWidth: "94vw", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text)", fontStyle: "italic" }}>
            Add Savings Goal
          </div>
          <button className="close-btn" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Goal Name</label>
            <input type="text" placeholder="e.g. New Laptop, Holiday Fund" value={name} onChange={(e) => setName(e.target.value)} style={fieldInput} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Target Amount ($)</label>
            <input type="number" min={0} step={1} placeholder="1000" value={target} onChange={(e) => setTarget(e.target.value)} style={fieldInput} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Saved So Far ($)</label>
            <input type="number" min={0} step={1} placeholder="0" value={saved} onChange={(e) => setSaved(e.target.value)} style={fieldInput} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit}>
            Add Goal
          </button>
        </div>
      </div>
    </div>
  );
}
