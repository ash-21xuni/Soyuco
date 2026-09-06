"use client";

import { useState } from "react";
import { CAT_LABELS, useBudget, type Transaction } from "@/lib/budget/budget-context";
import { TxModal } from "@/components/modals/TxModal";

export function TransactionList() {
  const { transactions, saveTransaction, deleteTransaction } = useBudget();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);

  const sorted = transactions.slice().reverse();

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <div className="planner-card-title">◈ Transactions</div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: "0.68rem", padding: "3px 8px" }}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          + Add
        </button>
      </div>
      <div style={{ padding: 0, maxHeight: 420, overflowY: "auto" }}>
        {sorted.length === 0 ? (
          <div style={{ padding: 20, fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text3)", textAlign: "center" }}>
            No transactions yet. Add one above.
          </div>
        ) : (
          sorted.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: t.type === "income" ? "var(--success)" : "var(--danger)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.desc}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text3)", marginTop: 2 }}>
                  {CAT_LABELS[t.cat] ?? t.cat} · {t.date}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, color: t.type === "income" ? "var(--success)" : "var(--danger)" }}>
                {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
              </div>
              <button
                onClick={() => {
                  setEditing(t);
                  setOpen(true);
                }}
                style={{ fontSize: "0.65rem", color: "var(--text3)", padding: "2px 6px", background: "none", border: "1px solid transparent", borderRadius: "var(--radius)", cursor: "pointer" }}
              >
                ✎
              </button>
            </div>
          ))
        )}
      </div>

      <TxModal
        open={open}
        editing={editing}
        onCancel={() => setOpen(false)}
        onSave={(fields) => {
          saveTransaction(editing?.id ?? null, fields);
          setOpen(false);
        }}
        onDelete={() => {
          if (editing) deleteTransaction(editing.id);
          setOpen(false);
        }}
      />
    </div>
  );
}
