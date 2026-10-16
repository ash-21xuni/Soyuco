"use client";

import { useMemo, useState } from "react";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import { useBudget, type Category, type TxFields, type TxType } from "@/lib/budget/budget-context";
import { FREQ_LABELS, FREQUENCIES, todayStr, type Frequency } from "@/lib/budget/recurring";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { useCurrency } from "@/lib/budget/currency";

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "food", label: "Food & Dining" },
  { value: "transport", label: "Transport" },
  { value: "housing", label: "Housing" },
  { value: "health", label: "Health" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "utilities", label: "Utilities" },
  { value: "salary", label: "Salary" },
  { value: "other", label: "Other" },
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
const noteStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
  fontFamily: "var(--font-ui)",
  fontSize: "0.72rem",
  color: "var(--text3)",
  lineHeight: 1.4,
};

export type TxDraft = TxFields & { repeat: Frequency | "none"; endDate: string | null };

// "add" can create a one-off or a recurring item, "editTx" edits a single
// transaction and "editRule" edits a recurring item's schedule.
export type TxModalMode = "add" | "editTx" | "editRule";

export function TxModal({
  open,
  mode,
  initial,
  note,
  onCancel,
  onSave,
  onDelete,
}: {
  open: boolean;
  mode: TxModalMode;
  initial?: Partial<TxDraft> | null;
  note?: string;
  onCancel: () => void;
  onSave: (draft: TxDraft) => void;
  onDelete?: () => void;
}) {
  const { transactions, recurring } = useBudget();
  const { symbol } = useCurrency();
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TxType>("expense");
  const [cat, setCat] = useState<Category>("food");
  const [date, setDate] = useState(todayStr);
  const [repeat, setRepeat] = useState<Frequency | "none">("none");
  const [endDate, setEndDate] = useState("");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDesc(initial?.desc ?? "");
      setAmount(initial?.amount ? String(initial.amount) : "");
      setType(initial?.type ?? "expense");
      setCat(initial?.cat ?? "food");
      setDate(initial?.date ?? todayStr());
      setRepeat(initial?.repeat ?? (mode === "editRule" ? "monthly" : "none"));
      setEndDate(initial?.endDate ?? "");
    }
  }

  // Past descriptions, newest first, to suggest and auto-fill from.
  const history = useMemo(() => {
    const seen = new Map<string, { desc: string; amount: number; type: TxType; cat: Category }>();
    const all = [...recurring, ...transactions.slice().sort((a, b) => b.date.localeCompare(a.date))];
    for (const t of all) {
      const key = t.desc.trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, t);
    }
    return seen;
  }, [transactions, recurring]);

  useEscapeToClose(open, onCancel);
  if (!open) return null;

  const isRecurring = mode === "editRule" || (mode === "add" && repeat !== "none");
  const title = mode === "add" ? "Add Transaction" : mode === "editRule" ? "Edit Recurring" : "Edit Transaction";

  // Like Monarch's rules: typing a description used before fills in its
  // type and category (and amount, if not entered yet).
  function changeDesc(value: string) {
    setDesc(value);
    if (mode !== "add") return;
    const match = history.get(value.trim().toLowerCase());
    if (!match) return;
    setType(match.type);
    setCat(match.cat);
    if (!amount) setAmount(String(match.amount));
  }

  function submit() {
    const parsed = parseFloat(amount);
    if (!desc.trim() || isNaN(parsed) || parsed <= 0) {
      alert("Please enter a description and valid amount.");
      return;
    }
    if (isRecurring && endDate && endDate < date) {
      alert("The end date can't be before the start date.");
      return;
    }
    onSave({
      desc: desc.trim(),
      amount: parsed,
      type,
      cat,
      date,
      repeat: isRecurring ? repeat : "none",
      endDate: isRecurring && endDate ? endDate : null,
    });
  }

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.55)", zIndex: 300, alignItems: "center", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", width: 400, maxWidth: "94vw", maxHeight: "92vh", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text)", fontStyle: "italic" }}>
            {title}
          </div>
          <button className="close-btn" onClick={onCancel} aria-label="Close">
            <SettingsIcon name="close" size={14} />
          </button>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {note && (
            <div style={noteStyle}>
              <SettingsIcon name="repeat" size={13} /> {note}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Description</label>
            <input
              type="text"
              placeholder="e.g. Grocery shopping"
              value={desc}
              onChange={(e) => changeDesc(e.target.value)}
              list={mode === "add" ? "tx-desc-history" : undefined}
              style={fieldInput}
            />
            {mode === "add" && (
              <datalist id="tx-desc-history">
                {[...history.values()].slice(0, 30).map((h) => (
                  <option key={h.desc} value={h.desc} />
                ))}
              </datalist>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabel}>Amount ({symbol})</label>
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
          {mode !== "editTx" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={fieldLabel}>Repeats</label>
              <select value={repeat} onChange={(e) => setRepeat(e.target.value as Frequency | "none")} style={fieldInput}>
                {mode === "add" && <option value="none">Doesn&apos;t repeat</option>}
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {FREQ_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
              <label style={fieldLabel}>{isRecurring ? "Starts" : "Date"}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldInput} />
            </div>
            {isRecurring && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                <label style={fieldLabel}>Ends (optional)</label>
                <input type="date" value={endDate} min={date} onChange={(e) => setEndDate(e.target.value)} style={fieldInput} />
              </div>
            )}
          </div>
          {isRecurring && (
            <div style={noteStyle}>
              <SettingsIcon name="info" size={13} />
              {mode === "add"
                ? "Added to your transactions automatically on each date. Any dates already passed since it started are added now."
                : "Changes apply to future transactions; ones already added stay as they are."}
            </div>
          )}
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
              {mode === "add" ? (isRecurring ? "Add Recurring" : "Add Transaction") : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
