"use client";

import { useMemo } from "react";
import { inMonth, useBudget } from "@/lib/budget/budget-context";
import { addDays, monthBounds, monthKey, monthLabel, occurrencesBetween, todayStr } from "@/lib/budget/recurring";
import { useCurrency } from "@/lib/budget/currency";

export function SummaryStrip() {
  const { transactions, goals, recurring, viewMonth } = useBudget();
  const { money } = useCurrency();

  const monthTx = useMemo(() => inMonth(transactions, viewMonth), [transactions, viewMonth]);
  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = income - expenses;

  // Recurring items still to come this month (nothing for past months).
  const upcoming = useMemo(() => {
    const { first, last } = monthBounds(viewMonth);
    const tomorrow = addDays(todayStr(), 1);
    const from = tomorrow > first ? tomorrow : first;
    let inc = 0;
    let out = 0;
    for (const rule of recurring) {
      if (!rule.active) continue;
      const total = occurrencesBetween(rule, from, last).length * rule.amount;
      if (rule.type === "income") inc += total;
      else out += total;
    }
    return { income: inc, expenses: out };
  }, [recurring, viewMonth]);

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const savingsPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const autoSave = goals.filter((g) => g.saved < g.target).reduce((s, g) => s + g.monthly, 0);

  const isCurrent = viewMonth === monthKey(todayStr());
  const period = isCurrent ? "This month" : monthLabel(viewMonth);
  const hasUpcoming = upcoming.income > 0 || upcoming.expenses > 0;
  const projected = net + upcoming.income - upcoming.expenses;
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : null;

  const cards = [
    {
      label: "Income",
      value: money(income),
      sub: upcoming.income > 0 ? `+${money(upcoming.income)} still expected` : period,
      border: "var(--success)",
    },
    {
      label: "Expenses",
      value: money(expenses),
      sub: upcoming.expenses > 0 ? `${money(upcoming.expenses)} in bills still due` : period,
      border: "var(--danger)",
    },
    {
      label: "Balance",
      value: money(net),
      sub: hasUpcoming
        ? `Projected ${money(projected)} by month end`
        : savingsRate !== null
          ? `${savingsRate}% of income kept`
          : "Income minus expenses",
      border: "var(--accent)",
      color: net >= 0 ? "var(--success)" : "var(--danger)",
    },
    {
      label: "Savings",
      value: money(totalSaved),
      sub: autoSave > 0 ? `${savingsPct}% of goal · ${money(autoSave)}/mo auto` : `${savingsPct}% of goal`,
      border: "var(--accent2)",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 20 }}>
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
