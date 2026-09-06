"use client";

import { usePlanner } from "@/lib/planner/planner-context";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar() {
  const { calendarMonth, plannerDay, events, setPlannerDay, setCalendarMonth } = usePlanner();

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="cal-cell cal-empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    const dayKey = cellDate.toDateString();
    const isToday = dayKey === today.toDateString();
    const isSelected = dayKey === plannerDay.toDateString();
    const dotCount = Math.min(Object.keys(events[dayKey] ?? {}).length, 3);

    cells.push(
      <div
        key={d}
        className={`cal-cell${isToday ? " cal-today" : ""}${isSelected ? " cal-selected" : ""}`}
        onClick={() => setPlannerDay(new Date(year, month, d))}
      >
        <span className="cal-day-num">{d}</span>
        {dotCount > 0 && (
          <div className="cal-dots">
            {Array.from({ length: dotCount }).map((_, i) => (
              <div key={i} className="cal-dot" />
            ))}
          </div>
        )}
      </div>,
    );
  }

  return (
    <div className="planner-card">
      <div className="planner-card-header" style={{ padding: "8px 12px" }}>
        <button
          className="nav-btn"
          style={{ padding: "3px 7px", fontSize: "0.75rem" }}
          onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
        >
          ◀
        </button>
        <div
          className="planner-card-title"
          style={{ textTransform: "none", fontSize: "0.78rem", letterSpacing: 0, color: "var(--text)" }}
        >
          {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
        <button
          className="nav-btn"
          style={{ padding: "3px 7px", fontSize: "0.75rem" }}
          onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
        >
          ▶
        </button>
      </div>
      <div className="planner-card-body" style={{ padding: "6px 10px 10px" }}>
        <div className="cal-grid">
          {WEEKDAY_HEADERS.map((d) => (
            <div key={d} className="cal-day-header">
              {d}
            </div>
          ))}
          {cells}
        </div>
      </div>
    </div>
  );
}
