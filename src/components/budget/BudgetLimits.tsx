"use client";

import { useMemo, useState } from "react";
import { CAT_ICONS, CAT_LABELS, inMonth, useBudget, type Category } from "@/lib/budget/budget-context";
import { monthBounds, monthKey, parseDate, todayStr } from "@/lib/budget/recurring";
import { LimitModal } from "@/components/modals/LimitModal";
import { SettingsCardTitle, SettingsIcon } from "@/components/settings/SettingsIcon";
import { useCurrency } from "@/lib/budget/currency";

export function BudgetLimits() {
  const { transactions, limits, viewMonth, saveLimit, deleteLimit } = useBudget();
  const [open, setOpen] = useState(false);
  const { money } = useCurrency();

  const catTotals = useMemo(() => {
    const totals: Partial<Record<Category, number>> = {};
    inMonth(transactions, viewMonth)
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        totals[t.cat] = (totals[t.cat] ?? 0) + t.amount;
      });
    return totals;
  }, [transactions, viewMonth]);

  // Days left including today, for a "per day" allowance in the current month.
  const today = todayStr();
  const daysLeft =
    viewMonth === monthKey(today) ? parseDate(monthBounds(viewMonth).last).getDate() - parseDate(today).getDate() + 1 : null;

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <SettingsCardTitle icon="gauge">Budget Limits</SettingsCardTitle>
        <button className="btn btn-ghost" style={{ fontSize: "0.68rem", padding: "3px 8px" }} onClick={() => setOpen(true)}>
          + Limit
        </button>
      </div>
      <div className="planner-card-body">
        {limits.length === 0 ? (
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text3)", textAlign: "center" }}>
            Set monthly spending limits per category. You&apos;ll get a heads-up at 80% and when you go over.
          </div>
        ) : (
          limits.map((l) => {
            const spent = catTotals[l.cat] ?? 0;
            const left = l.amount - spent;
            const pct = Math.min(100, Math.round((spent / l.amount) * 100));
            const col = pct >= 100 ? "var(--danger)" : pct >= 80 ? "var(--accent2)" : "var(--success)";
            return (
              <div key={l.cat} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}><SettingsIcon name={CAT_ICONS[l.cat] ?? "tag"} size={12} /> {CAT_LABELS[l.cat] ?? l.cat}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: col }}>
                      {money(spent, true)} / {money(l.amount, true)}
                    </span>
                    <button onClick={() => deleteLimit(l.cat)} style={{ fontSize: "0.6rem", color: "var(--text3)", padding: "1px 4px", background: "none", border: "none", cursor: "pointer" }} aria-label="Remove limit">
                      <SettingsIcon name="close" size={12} />
                    </button>
                  </span>
                </div>
                <div style={{ height: 5, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 4 }} />
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: left < 0 ? "var(--danger)" : "var(--text3)" }}>
                  {left < 0
                    ? `${money(Math.abs(left))} over`
                    : `${money(left)} left${daysLeft ? ` · about ${money(left / daysLeft)}/day` : ""}`}
                </div>
              </div>
            );
          })
        )}
      </div>

      <LimitModal
        open={open}
        onCancel={() => setOpen(false)}
        onSave={(cat, amount) => {
          saveLimit(cat, amount);
          setOpen(false);
        }}
      />
    </div>
  );
}
