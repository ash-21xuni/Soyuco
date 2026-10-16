"use client";

import { useMemo } from "react";
import { CAT_ICONS, CAT_LABELS, inMonth, useBudget, type Category } from "@/lib/budget/budget-context";
import { monthLabel, shiftMonth } from "@/lib/budget/recurring";
import { SettingsCardTitle, SettingsIcon } from "@/components/settings/SettingsIcon";
import { useCurrency } from "@/lib/budget/currency";

function totalsByCategory(transactions: ReturnType<typeof inMonth>) {
  const totals: Partial<Record<Category, number>> = {};
  for (const t of transactions) {
    if (t.type === "expense") totals[t.cat] = (totals[t.cat] ?? 0) + t.amount;
  }
  return totals;
}

export function CategoryBreakdown() {
  const { transactions, viewMonth } = useBudget();
  const { money } = useCurrency();

  const { entries, total, previous } = useMemo(() => {
    const totals = totalsByCategory(inMonth(transactions, viewMonth));
    const entries = (Object.entries(totals) as [Category, number][]).sort((a, b) => b[1] - a[1]);
    return {
      entries,
      total: entries.reduce((s, [, v]) => s + v, 0),
      previous: totalsByCategory(inMonth(transactions, shiftMonth(viewMonth, -1))),
    };
  }, [transactions, viewMonth]);

  const maxV = entries[0]?.[1] ?? 0;

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <SettingsCardTitle icon="pieChart">Spending by Category</SettingsCardTitle>
      </div>
      <div className="planner-card-body">
        {entries.length === 0 ? (
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text3)", textAlign: "center" }}>
            No spending in {monthLabel(viewMonth)}.
          </div>
        ) : (
          entries.map(([cat, amt]) => {
            // Compared with the month before, like Monarch's month-over-month view.
            const prev = previous[cat] ?? 0;
            const change = prev > 0 ? Math.round(((amt - prev) / prev) * 100) : null;
            return (
              <div key={cat} style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text2)", display: "flex", alignItems: "center", gap: 6 }}>
                    <SettingsIcon name={CAT_ICONS[cat] ?? "tag"} size={12} /> {CAT_LABELS[cat] ?? cat}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text3)" }}>
                      {Math.round((amt / total) * 100)}%
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    {change !== null && change !== 0 && (
                      <span
                        title="Compared with the previous month"
                        style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: change > 0 ? "var(--danger)" : "var(--success)" }}
                      >
                        {change > 0 ? "▲" : "▼"} {Math.abs(change)}%
                      </span>
                    )}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--accent2)" }}>{money(amt)}</span>
                  </span>
                </div>
                <div style={{ height: 5, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round((amt / maxV) * 100)}%`, background: "var(--accent)", borderRadius: 4 }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
