"use client";

import { useEffect, useRef, useState } from "react";
import { usePlanner } from "@/lib/planner/planner-context";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { MonthYearPicker } from "@/components/planner/MonthYearPicker";
import { DayPeek } from "@/components/planner/DayPeek";
import { occursOn } from "@/lib/planner/tasks";
import { eventColorValue, eventsForDay } from "@/lib/planner/events";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHOW_DELAY_MS = 180;
const HIDE_DELAY_MS = 120;

type Peek = { dayKey: string; anchor: DOMRect };

export function Calendar() {
  const { calendarMonth, plannerDay, events, todos, setPlannerDay, setCalendarMonth } = usePlanner();
  const [peek, setPeek] = useState<Peek | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
    },
    [],
  );

  // First hover waits a beat; once a peek is open it follows the pointer
  // from cell to cell straight away.
  function hoverDay(dayKey: string, el: HTMLElement) {
    clearTimeout(hideTimer.current);
    clearTimeout(showTimer.current);
    const next = { dayKey, anchor: el.getBoundingClientRect() };
    if (peek) setPeek(next);
    else showTimer.current = setTimeout(() => setPeek(next), SHOW_DELAY_MS);
  }

  function scheduleHide() {
    clearTimeout(showTimer.current);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setPeek(null), HIDE_DELAY_MS);
  }

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
    const isPeeked = peek?.dayKey === dayKey;
    // Up to three dots: one per event in its colour, then one for tasks.
    const dots = eventsForDay(events, dayKey).map((ev) => eventColorValue(ev.color));
    if (todos.some((t) => occursOn(t, dayKey))) dots.push("var(--accent)");
    const shownDots = dots.slice(0, 3);

    cells.push(
      <div
        key={d}
        className={`cal-cell${isToday ? " cal-today" : ""}${isSelected ? " cal-selected" : ""}${isPeeked ? " cal-peeked" : ""}`}
        onClick={() => setPlannerDay(new Date(year, month, d))}
        onMouseEnter={(e) => hoverDay(dayKey, e.currentTarget)}
        onMouseLeave={scheduleHide}
      >
        <span className="cal-day-num">{d}</span>
        {shownDots.length > 0 && (
          <div className="cal-dots">
            {shownDots.map((color, i) => (
              <div key={i} className="cal-dot" style={{ background: color }} />
            ))}
          </div>
        )}
      </div>,
    );
  }

  return (
    <div className="planner-card cal-card">
      <div className="planner-card-header" style={{ padding: "8px 12px" }}>
        <button
          className="nav-btn cal-nav"
          aria-label="Previous month"
          onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
        >
          <SettingsIcon name="chevronLeft" size={14} />
        </button>
        <MonthYearPicker value={calendarMonth} onChange={setCalendarMonth} />
        <button
          className="nav-btn cal-nav"
          aria-label="Next month"
          onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
        >
          <SettingsIcon name="chevronRight" size={14} />
        </button>
      </div>
      <div className="planner-card-body" style={{ padding: "6px 10px 10px" }}>
        <div className="cal-grid" onMouseLeave={scheduleHide}>
          {WEEKDAY_HEADERS.map((d) => (
            <div key={d} className="cal-day-header">
              {d}
            </div>
          ))}
          {cells}
        </div>
      </div>

      {peek && (
        <DayPeek
          dayKey={peek.dayKey}
          anchor={peek.anchor}
          onPointerEnter={() => clearTimeout(hideTimer.current)}
          onPointerLeave={scheduleHide}
        />
      )}
    </div>
  );
}
