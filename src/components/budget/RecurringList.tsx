"use client";

import { useMemo, useState } from "react";
import { CAT_ICONS, useBudget, type RecurringRule } from "@/lib/budget/budget-context";
import { FREQ_LABELS, addDays, monthlyEquivalent, nextOccurrence, relativeDay, todayStr } from "@/lib/budget/recurring";
import { TxModal, type TxDraft } from "@/components/modals/TxModal";
import { SettingsCardTitle, SettingsIcon } from "@/components/settings/SettingsIcon";
import { useCurrency } from "@/lib/budget/currency";

const iconBtn: React.CSSProperties = {
  color: "var(--text3)",
  padding: "2px 6px",
  background: "none",
  border: "1px solid transparent",
  borderRadius: "var(--radius)",
  cursor: "pointer",
};

// Bills, subscriptions and pay that repeat. Each one adds itself to the
// transactions on its due dates, and the card doubles as an upcoming-bills list.
export function RecurringList() {
  const { recurring, saveTransaction, saveRecurring, setRecurringActive, deleteRecurring } = useBudget();
  const [editing, setEditing] = useState<RecurringRule | null>(null);
  const [open, setOpen] = useState(false);
  const { money } = useCurrency();
  const today = todayStr();

  const rows = useMemo(
    () =>
      recurring
        .map((rule) => ({ rule, next: rule.active ? nextOccurrence(rule, today) : null }))
        // Soonest first; paused and finished ones at the bottom.
        .sort((a, b) => (a.next ?? "9999").localeCompare(b.next ?? "9999") || a.rule.desc.localeCompare(b.rule.desc)),
    [recurring, today],
  );

  const totals = useMemo(() => {
    let income = 0;
    let bills = 0;
    for (const { rule, next } of rows) {
      if (!next) continue;
      const perMonth = monthlyEquivalent(rule.amount, rule.frequency);
      if (rule.type === "income") income += perMonth;
      else bills += perMonth;
    }
    return { income, bills };
  }, [rows]);

  function save(draft: TxDraft) {
    const { repeat, endDate, date, ...fields } = draft;
    if (repeat === "none") saveTransaction(null, { ...fields, date });
    else saveRecurring(editing?.id ?? null, { ...fields, frequency: repeat, startDate: date, endDate });
    setOpen(false);
  }

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <SettingsCardTitle icon="repeat">Recurring</SettingsCardTitle>
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

      {rows.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 14px",
            padding: "10px 16px",
            borderBottom: "1px solid var(--border)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--text3)",
          }}
        >
          <span>
            In <span style={{ color: "var(--success)" }}>{money(totals.income, true)}</span>/mo
          </span>
          <span>
            Out <span style={{ color: "var(--danger)" }}>{money(totals.bills, true)}</span>/mo
          </span>
          <span title="Recurring income minus recurring expenses">
            Left{" "}
            <span style={{ color: totals.income - totals.bills >= 0 ? "var(--text)" : "var(--danger)" }}>
              {money(totals.income - totals.bills, true)}
            </span>
            /mo
          </span>
        </div>
      )}

      <div style={{ padding: 0, maxHeight: 360, overflowY: "auto" }}>
        {rows.length === 0 ? (
          <div style={{ padding: 20, fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text3)", textAlign: "center", lineHeight: 1.5 }}>
            Add your salary, rent, subscriptions and other regular items once and they&apos;ll be logged automatically.
          </div>
        ) : (
          rows.map(({ rule, next }) => {
            const status = !rule.active ? "Paused" : next ? relativeDay(next, today) : "Ended";
            const soon = next !== null && next <= addDays(today, 7);
            return (
              <div
                key={rule.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--border)",
                  opacity: next ? 1 : 0.55,
                }}
              >
                <span style={{ color: "var(--text3)", display: "inline-flex" }}>
                  <SettingsIcon name={CAT_ICONS[rule.cat] ?? "tag"} size={14} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {rule.desc}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text3)", marginTop: 2 }}>
                    {FREQ_LABELS[rule.frequency]} ·{" "}
                    <span style={{ color: soon && rule.type === "expense" ? "var(--accent2)" : undefined }}>{status}</span>
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 600, color: rule.type === "income" ? "var(--success)" : "var(--danger)" }}>
                  {rule.type === "income" ? "+" : "-"}{money(rule.amount)}
                </div>
                <button
                  onClick={() => setRecurringActive(rule.id, !rule.active)}
                  style={iconBtn}
                  aria-label={rule.active ? `Pause ${rule.desc}` : `Resume ${rule.desc}`}
                  title={rule.active ? "Pause" : "Resume"}
                >
                  <SettingsIcon name={rule.active ? "pause" : "play"} size={12} />
                </button>
                <button
                  onClick={() => {
                    setEditing(rule);
                    setOpen(true);
                  }}
                  style={iconBtn}
                  aria-label={`Edit ${rule.desc}`}
                >
                  <SettingsIcon name="pencil" size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <TxModal
        open={open}
        mode={editing ? "editRule" : "add"}
        initial={
          editing
            ? { ...editing, date: editing.startDate, repeat: editing.frequency }
            : { repeat: "monthly" }
        }
        onCancel={() => setOpen(false)}
        onSave={save}
        onDelete={
          editing
            ? () => {
                deleteRecurring(editing.id);
                setOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}
