"use client";

import { useState } from "react";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import type { Category } from "@/lib/budget/budget-context";

const LIMIT_CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "food", label: "🍔 Food & Dining" },
  { value: "transport", label: "🚗 Transport" },
  { value: "housing", label: "🏠 Housing" },
  { value: "health", label: "💊 Health" },
  { value: "entertainment", label: "🎬 Entertainment" },
  { value: "shopping", label: "🛍 Shopping" },
  { value: "utilities", label: "💡 Utilities" },
  { value: "other", label: "◇ Other" },
];

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

export function LimitModal({
  open,
  onCancel,
  onSave,
}: {
  open: boolean;
  onCancel: () => void;
  onSave: (cat: Category, amount: number) => void;
}) {
  const [cat, setCat] = useState<Category>("food");
  const [amount, setAmount] = useState("");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setAmount("");
  }

  useEscapeToClose(open, onCancel);
  if (!open) return null;

  function submit() {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      alert("Please enter a valid limit.");
      return;
    }
    onSave(cat, parsed);
  }

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.55)", zIndex: 300, alignItems: "center", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", width: 360, maxWidth: "94vw", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text)", fontStyle: "italic" }}>
            Set Budget Limit
          </div>
          <button className="close-btn" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Category</label>
            <select value={cat} onChange={(e) => setCat(e.target.value as Category)} style={fieldInput}>
              {LIMIT_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Monthly Limit ($)</label>
            <input type="number" min={0} step={1} placeholder="500" value={amount} onChange={(e) => setAmount(e.target.value)} style={fieldInput} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit}>
            Set Limit
          </button>
        </div>
      </div>
    </div>
  );
}
