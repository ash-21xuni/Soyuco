"use client";

import { useState } from "react";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import type { Category, Transaction, TxType } from "@/lib/budget/budget-context";

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "food", label: "🍔 Food & Dining" },
  { value: "transport", label: "🚗 Transport" },
  { value: "housing", label: "🏠 Housing" },
  { value: "health", label: "💊 Health" },
  { value: "entertainment", label: "🎬 Entertainment" },
  { value: "shopping", label: "🛍 Shopping" },
  { value: "utilities", label: "💡 Utilities" },
  { value: "salary", label: "💼 Salary" },
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

export function TxModal({
  open,
  editing,
  onCancel,
  onSave,
  onDelete,
}: {
  open: boolean;
  editing: Transaction | null;
  onCancel: () => void;
  onSave: (fields: { desc: string; amount: number; type: TxType; cat: Category; date: string }) => void;
  onDelete: () => void;
}) {
  const isEdit = editing !== null;
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TxType>("expense");
  const [cat, setCat] = useState<Category>("food");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDesc(editing?.desc ?? "");
      setAmount(editing ? String(editing.amount) : "");
      setType(editing?.type ?? "expense");
      setCat(editing?.cat ?? "food");
      setDate(editing?.date ?? new Date().toISOString().split("T")[0]);
    }
  }

  useEscapeToClose(open, onCancel);
  if (!open) return null;

  function submit() {
    const parsed = parseFloat(amount);
    if (!desc.trim() || isNaN(parsed) || parsed <= 0) {
      alert("Please enter a description and valid amount.");
      return;
    }
    onSave({ desc: desc.trim(), amount: parsed, type, cat, date });
  }

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.55)", zIndex: 300, alignItems: "center", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", width: 400, maxWidth: "94vw", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text)", fontStyle: "italic" }}>
            {isEdit ? "Edit Transaction" : "Add Transaction"}
          </div>
          <button className="close-btn" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Description</label>
            <input type="text" placeholder="e.g. Grocery shopping" value={desc} onChange={(e) => setDesc(e.target.value)} style={fieldInput} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Amount ($)</label>
            <input type="number" min={0} step={0.01} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} style={fieldInput} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Type</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={type === "expense" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setType("expense")}>
                Expense
              </button>
              <button className={type === "income" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setType("income")}>
                Income
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Category</label>
            <select value={cat} onChange={(e) => setCat(e.target.value as Category)} style={fieldInput}>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldInput} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
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
            <button className="btn btn-primary" onClick={submit}>
              {isEdit ? "Save Changes" : "Add Transaction"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
