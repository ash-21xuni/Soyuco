"use client";

import { useBudget } from "@/lib/budget/budget-context";
import { monthKey, monthLabel, shiftMonth, todayStr } from "@/lib/budget/recurring";
import { SettingsIcon } from "@/components/settings/SettingsIcon";

// Picks which month the summary, transactions, categories and limits show.
export function MonthNav() {
  const { viewMonth, setViewMonth } = useBudget();
  const current = monthKey(todayStr());

  return (
    <div className="planner-date-nav" style={{ marginBottom: 16 }}>
      <button className="nav-btn" onClick={() => setViewMonth(shiftMonth(viewMonth, -1))} aria-label="Previous month">
        <SettingsIcon name="chevronLeft" size={14} />
      </button>
      <div className="planner-date-title" style={{ fontSize: "1.25rem", minWidth: 170, textAlign: "center" }}>
        {monthLabel(viewMonth)}
      </div>
      <button className="nav-btn" onClick={() => setViewMonth(shiftMonth(viewMonth, 1))} aria-label="Next month">
        <SettingsIcon name="chevronRight" size={14} />
      </button>
      {viewMonth !== current && (
        <button className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "5px 10px" }} onClick={() => setViewMonth(current)}>
          This month
        </button>
      )}
    </div>
  );
}
