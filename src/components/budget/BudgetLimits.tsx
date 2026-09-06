"use client";

import { useMemo, useState } from "react";
import { CAT_LABELS, useBudget, type Category } from "@/lib/budget/budget-context";
import { LimitModal } from "@/components/modals/LimitModal";

export function BudgetLimits() {
  const { transactions, limits, saveLimit, deleteLimit } = useBudget();
  const [open, setOpen] = useState(false);

  const catTotals = useMemo(() => {
    const totals: Partial<Record<Category, number>> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        totals[t.cat] = (totals[t.cat] ?? 0) + t.amount;
      });
    return totals;
  }, [transactions]);

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <div className="planner-card-title">✦ Budget Limits</div>
        <button className="btn btn-ghost" style={{ fontSize: "0.68rem", padding: "3px 8px" }} onClick={() => setOpen(true)}>
          + Limit
        </button>
      </div>
      <div className="planner-card-body">
        {limits.length === 0 ? (
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text3)", textAlign: "center" }}>
            Set spending limits per category.
          </div>
        ) : (
          limits.map((l) => {
            const spent = catTotals[l.cat] ?? 0;
            const pct = Math.min(100, Math.round((spent / l.amount) * 100));
            const col = pct >= 100 ? "var(--danger)" : pct >= 80 ? "var(--accent2)" : "var(--success)";
            return (
              <div key={l.cat} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--text)" }}>{CAT_LABELS[l.cat] ?? l.cat}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: col }}>
                      ${spent.toFixed(0)} / ${l.amount.toFixed(0)}
                    </span>
                    <button onClick={() => deleteLimit(l.cat)} style={{ fontSize: "0.6rem", color: "var(--text3)", padding: "1px 4px", background: "none", border: "none", cursor: "pointer" }}>
                      ✕
                    </button>
                  </span>
                </div>
                <div style={{ height: 5, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 4 }} />
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
