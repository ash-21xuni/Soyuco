"use client";

import { useState } from "react";
import { CAT_ICONS, CAT_LABELS, inMonth, useBudget, type Transaction } from "@/lib/budget/budget-context";
import { monthKey, monthLabel, shortDate, todayStr } from "@/lib/budget/recurring";
import { TxModal, type TxDraft } from "@/components/modals/TxModal";
import { SettingsCardTitle, SettingsIcon } from "@/components/settings/SettingsIcon";
import { useCurrency } from "@/lib/budget/currency";

function csvCell(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Every transaction as a spreadsheet-friendly CSV download.
function exportCsv(transactions: Transaction[], currency: string) {
  const rows = [
    ["Date", "Description", "Type", "Category", `Amount (${currency})`, "Recurring"],
    ...transactions
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => [t.date, t.desc, t.type, CAT_LABELS[t.cat] ?? t.cat, (t.type === "income" ? t.amount : -t.amount).toFixed(2), t.recurringId ? "yes" : ""]),
  ];
  const blob = new Blob([rows.map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "soyuco-transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function TransactionList() {
  const { transactions, viewMonth, saveTransaction, deleteTransaction, saveRecurring } = useBudget();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);
  const { code, money } = useCurrency();

  const shown = inMonth(transactions, viewMonth).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  function save(draft: TxDraft) {
    const { repeat, endDate, ...fields } = draft;
    if (!editing && repeat !== "none") {
      saveRecurring(null, { ...fields, frequency: repeat, startDate: fields.date, endDate });
    } else {
      saveTransaction(editing?.id ?? null, fields);
    }
    setOpen(false);
  }

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <SettingsCardTitle icon="arrowLeftRight">Transactions</SettingsCardTitle>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: "0.68rem", padding: "3px 8px" }}
            onClick={() => exportCsv(transactions, code)}
            disabled={!transactions.length}
            title="Download all transactions as CSV"
            aria-label="Export transactions as CSV"
          >
            <SettingsIcon name="download" size={12} />
          </button>
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
      </div>
      <div style={{ padding: 0, maxHeight: 420, overflowY: "auto" }}>
        {shown.length === 0 ? (
          <div style={{ padding: 20, fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text3)", textAlign: "center" }}>
            No transactions in {monthLabel(viewMonth)}.
          </div>
        ) : (
          shown.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: t.type === "income" ? "var(--success)" : "var(--danger)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.desc}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text3)", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                  <SettingsIcon name={CAT_ICONS[t.cat] ?? "tag"} size={12} /> {CAT_LABELS[t.cat] ?? t.cat} · {shortDate(t.date)}
                  {t.recurringId != null && (
                    <span title="Added automatically by a recurring item" style={{ display: "inline-flex" }}>
                      <SettingsIcon name="repeat" size={11} />
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, color: t.type === "income" ? "var(--success)" : "var(--danger)" }}>
                {t.type === "income" ? "+" : "-"}{money(t.amount)}
              </div>
              <button
                onClick={() => {
                  setEditing(t);
                  setOpen(true);
                }}
                style={{ fontSize: "0.65rem", color: "var(--text3)", padding: "2px 6px", background: "none", border: "1px solid transparent", borderRadius: "var(--radius)", cursor: "pointer" }}
                aria-label="Edit transaction"
              >
                <SettingsIcon name="pencil" size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <TxModal
        open={open}
        mode={editing ? "editTx" : "add"}
        initial={editing ?? (viewMonth !== monthKey(todayStr()) ? { date: `${viewMonth}-01` } : null)}
        note={editing?.recurringId != null ? "Added by a recurring item. Changes here only affect this one." : undefined}
        onCancel={() => setOpen(false)}
        onSave={save}
        onDelete={
          editing
            ? () => {
                deleteTransaction(editing.id);
                setOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}
