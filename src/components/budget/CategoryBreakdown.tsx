"use client";

import { useMemo } from "react";
import { CAT_LABELS, useBudget, type Category } from "@/lib/budget/budget-context";

export function CategoryBreakdown() {
  const { transactions } = useBudget();

  const entries = useMemo(() => {
    const totals: Partial<Record<Category, number>> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        totals[t.cat] = (totals[t.cat] ?? 0) + t.amount;
      });
    return Object.entries(totals).sort((a, b) => (b[1] as number) - (a[1] as number)) as [Category, number][];
  }, [transactions]);

  const maxV = entries[0]?.[1] ?? 0;

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <div className="planner-card-title">◇ Spending by Category</div>
      </div>
      <div className="planner-card-body">
        {entries.length === 0 ? (
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text3)", textAlign: "center" }}>
            Add transactions to see breakdown.
          </div>
        ) : (
          entries.map(([cat, amt]) => (
            <div key={cat} style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text2)" }}>{CAT_LABELS[cat] ?? cat}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--accent2)" }}>${amt.toFixed(2)}</span>
              </div>
              <div style={{ height: 5, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round((amt / maxV) * 100)}%`, background: "var(--accent)", borderRadius: 4 }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
