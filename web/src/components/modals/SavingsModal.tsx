"use client";

import { useState } from "react";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import type { Goal } from "@/lib/budget/budget-context";

export function SavingsModal({
  open,
  goal,
  onCancel,
  onApply,
}: {
  open: boolean;
  goal: Goal | null;
  onCancel: () => void;
  onApply: (amount: number, isAdd: boolean) => void;
}) {
  const [amount, setAmount] = useState("");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setAmount("");
  }

  useEscapeToClose(open, onCancel);
  if (!open || !goal) return null;

  function submit(isAdd: boolean) {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    onApply(parsed, isAdd);
  }

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.55)", zIndex: 300, alignItems: "center", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", width: 380, maxWidth: "94vw", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text)", fontStyle: "italic" }}>
            {goal.name}
          </div>
          <button className="close-btn" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text2)" }}>
            Currently saved: <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent2)" }}>${goal.saved.toFixed(2)}</span>
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
              Amount ($)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn" style={{ background: "var(--danger)", color: "#fff" }} onClick={() => submit(false)}>
            − Remove
          </button>
          <button className="btn btn-primary" onClick={() => submit(true)}>
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
