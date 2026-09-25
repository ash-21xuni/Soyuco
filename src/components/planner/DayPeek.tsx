"use client";

import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePlanner } from "@/lib/planner/planner-context";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { deadlineOf, deadlineState, tasksForDay } from "@/lib/planner/tasks";
import { eventColorValue, eventsForDay, timeRangeLabel } from "@/lib/planner/events";

const MAX_ROWS = 5;

function shortTime(d: Date) {
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined })
    .replace(" ", "")
    .toLowerCase();
}
const GAP = 8;
const MARGIN = 12;

// Floating summary of a day's events and tasks, anchored to a calendar cell.
// Rendered in a portal so card overflow and page transforms can't clip it; it
// glides between cells as the pointer moves across the calendar.
export function DayPeek({
  dayKey,
  anchor,
  onPointerEnter,
  onPointerLeave,
}: {
  dayKey: string;
  anchor: DOMRect;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  const { events, todos } = usePlanner();
  const ref = useRef<HTMLDivElement>(null);
  const placed = useRef(false);

  const dayEvents = eventsForDay(events, dayKey);
  // Open tasks first, completed ones after, like the Tasks card.
  const dayTodos = tasksForDay(todos, dayKey).sort((a, b) => Number(a.doneOnDay) - Number(b.doneOnDay));
  const now = new Date();

  const date = new Date(dayKey);
  const isToday = dayKey === new Date().toDateString();

  // Below the cell when it fits, otherwise above; always inside the viewport.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    let top = anchor.bottom + GAP;
    let origin = "top";
    if (top + height > window.innerHeight - MARGIN) {
      top = Math.max(MARGIN, anchor.top - GAP - height);
      origin = "bottom";
    }
    const left = Math.min(
      Math.max(MARGIN, anchor.left + anchor.width / 2 - width / 2),
      window.innerWidth - width - MARGIN,
    );
    // First placement jumps; later moves between cells animate.
    el.style.transition = placed.current ? "" : "none";
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    el.style.transformOrigin = `center ${origin}`;
    placed.current = true;
  }, [anchor, dayKey, dayEvents.length, dayTodos.length]);

  return createPortal(
    <div
      ref={ref}
      className="day-peek"
      role="tooltip"
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
    >
      <div className="day-peek-head">
        <span className="day-peek-date">
          {date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
        </span>
        {isToday && <span className="day-peek-badge">Today</span>}
      </div>

      {dayEvents.length === 0 && dayTodos.length === 0 ? (
        <div className="day-peek-empty">Nothing planned yet. Click to plan this day.</div>
      ) : (
        <>
          {dayEvents.length > 0 && (
            <div className="day-peek-section">
              <div className="day-peek-label">Events</div>
              {dayEvents.slice(0, MAX_ROWS).map((ev) => (
                <div key={ev.id} className="day-peek-row">
                  <span className="day-peek-swatch" style={{ background: eventColorValue(ev.color) }} />
                  <span className="day-peek-time">{timeRangeLabel(ev.start, ev.end)}</span>
                  <span className="day-peek-text">{ev.title}</span>
                  {ev.repeat !== "none" && (
                    <span className="day-peek-icon" title="Repeats">
                      <SettingsIcon name="repeat" size={11} />
                    </span>
                  )}
                  {ev.ai && <span className="day-peek-ai">AI</span>}
                </div>
              ))}
              {dayEvents.length > MAX_ROWS && (
                <div className="day-peek-more">+{dayEvents.length - MAX_ROWS} more</div>
              )}
            </div>
          )}
          {dayTodos.length > 0 && (
            <div className="day-peek-section">
              <div className="day-peek-label">Tasks</div>
              {dayTodos.slice(0, MAX_ROWS).map((t) => {
                const due = deadlineOf(t);
                const overdue = !!due && !t.doneOnDay && deadlineState(due, now) === "overdue";
                const dueThisDay = !!due && due.toDateString() === dayKey;
                const time = due && t.dueTime ? shortTime(due) : "";
                return (
                  <div key={t.id} className={`day-peek-row${t.doneOnDay ? " done" : ""}`}>
                    <span className={`day-peek-check priority-${t.priority}`}>
                      <SettingsIcon name={t.doneOnDay ? "checkCircle" : "circle"} size={13} />
                    </span>
                    <span className="day-peek-text">{t.text}</span>
                    {t.repeat !== "none" && (
                      <span className="day-peek-icon" title="Repeats">
                        <SettingsIcon name="repeat" size={11} />
                      </span>
                    )}
                    {due &&
                      (overdue ? (
                        <span className="day-peek-due is-overdue">
                          <SettingsIcon name="alert" size={10} /> Overdue
                        </span>
                      ) : dueThisDay ? (
                        <span className="day-peek-due is-today">
                          Due on this day!{time && ` (${time})`}
                        </span>
                      ) : (
                        <span className="day-peek-due">
                          Due {due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          {time && `, ${time}`}
                        </span>
                      ))}
                  </div>
                );
              })}
              {dayTodos.length > MAX_ROWS && (
                <div className="day-peek-more">+{dayTodos.length - MAX_ROWS} more</div>
              )}
            </div>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}
