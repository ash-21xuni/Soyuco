"use client";

import { useBudget } from "@/lib/budget/budget-context";

export function SummaryStrip() {
  const { transactions, goals } = useBudget();

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const savingsPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const cards = [
    { label: "Income", value: `$${income.toFixed(2)}`, sub: "This month", border: "var(--success)" },
    { label: "Expenses", value: `$${expenses.toFixed(2)}`, sub: "This month", border: "var(--danger)" },
    {
      label: "Balance",
      value: `${balance < 0 ? "-$" : "$"}${Math.abs(balance).toFixed(2)}`,
      sub: "Remaining",
      border: "var(--accent)",
      color: balance >= 0 ? "var(--success)" : "var(--danger)",
    },
    { label: "Savings", value: `$${totalSaved.toFixed(2)}`, sub: `${savingsPct}% of goal`, border: "var(--accent2)" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
      {cards.map((c) => (
        <div key={c.label} className="planner-card" style={{ borderLeft: `3px solid ${c.border}` }}>
          <div className="planner-card-body">
            <div className="planner-card-title">{c.label}</div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.4rem",
                fontWeight: 700,
                color: c.color ?? "var(--text)",
                margin: "6px 0 2px",
              }}
            >
              {c.value}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text3)" }}>{c.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
