"use client";

import { useState } from "react";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import type { Goal } from "@/lib/budget/budget-context";
import { monthKey, monthsAfter, todayStr } from "@/lib/budget/recurring";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { useCurrency } from "@/lib/budget/currency";

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
const hint: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "0.7rem",
  color: "var(--text3)",
  lineHeight: 1.4,
};

export function GoalModal({
  open,
  editing,
  onCancel,
  onSave,
  onDelete,
}: {
  open: boolean;
  editing?: Goal | null;
  onCancel: () => void;
  onSave: (fields: { name: string; target: number; saved: number; monthly: number }) => void;
  onDelete?: () => void;
}) {
  const isEdit = !!editing;
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [monthly, setMonthly] = useState("");
  const [reachBy, setReachBy] = useState("");
  const { symbol } = useCurrency();

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(editing?.name ?? "");
      setTarget(editing ? String(editing.target) : "");
      setSaved(editing ? String(editing.saved) : "");
      setMonthly(editing?.monthly ? String(editing.monthly) : "");
      setReachBy("");
    }
  }

  useEscapeToClose(open, onCancel);
  if (!open) return null;

  // Like YNAB's target dates: pick when you want the money and the monthly
  // auto-save is worked out (this month counts as the first).
  function changeReachBy(value: string) {
    setReachBy(value);
    const remaining = (parseFloat(target) || 0) - (parseFloat(saved) || 0);
    if (!value || remaining <= 0) return;
    const months = monthsAfter(monthKey(todayStr()), value).length + 1;
    setMonthly(String(Math.ceil(remaining / months)));
  }

  function submit() {
    const t = parseFloat(target);
    const s = parseFloat(saved) || 0;
    const m = parseFloat(monthly) || 0;
    if (!name.trim() || isNaN(t) || t <= 0) {
      alert("Please enter a goal name and target amount.");
      return;
    }
    if (m < 0) {
      alert("The monthly auto-save can't be negative.");
      return;
    }
    onSave({ name: name.trim(), target: t, saved: s, monthly: m });
  }

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.55)", zIndex: 300, alignItems: "center", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", width: 380, maxWidth: "94vw", maxHeight: "92vh", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text)", fontStyle: "italic" }}>
            {isEdit ? "Edit Savings Goal" : "Add Savings Goal"}
          </div>
          <button className="close-btn" onClick={onCancel} aria-label="Close">
            <SettingsIcon name="close" size={14} />
          </button>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Goal Name</label>
            <input type="text" placeholder="e.g. New Laptop, Holiday Fund" value={name} onChange={(e) => setName(e.target.value)} style={fieldInput} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
              <label style={fieldLabel}>Target ({symbol})</label>
              <input type="number" min={0} step={1} placeholder="1000" value={target} onChange={(e) => setTarget(e.target.value)} style={fieldInput} />
            </div>
            {!isEdit && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                <label style={fieldLabel}>Saved So Far ({symbol})</label>
                <input type="number" min={0} step={1} placeholder="0" value={saved} onChange={(e) => setSaved(e.target.value)} style={fieldInput} />
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
              <label style={fieldLabel}>Auto-save / month ({symbol})</label>
              <input type="number" min={0} step={1} placeholder="0" value={monthly} onChange={(e) => setMonthly(e.target.value)} style={fieldInput} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
              <label style={fieldLabel}>Or reach by</label>
              <input type="month" min={monthKey(todayStr())} value={reachBy} onChange={(e) => changeReachBy(e.target.value)} style={fieldInput} />
            </div>
          </div>
          <div style={hint}>
            The monthly amount is added to this goal automatically at the start of each month until it&apos;s reached
            {isEdit && editing.monthly <= 0 ? ", starting this month" : ""}. Leave it at 0 to only add savings by hand.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
          {onDelete ? (
            <button className="btn" style={{ color: "var(--danger)", border: "1px solid var(--danger)" }} onClick={onDelete}>
              <SettingsIcon name="trash" size={14} /> Delete
            </button>
          ) : (
            <div />
          )}
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <button className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={submit}>
              {isEdit ? "Save Changes" : "Add Goal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
