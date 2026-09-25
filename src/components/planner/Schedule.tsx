"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { usePlanner } from "@/lib/planner/planner-context";
import { EventModal } from "@/components/modals/EventModal";
import { ScheduleSettingsModal } from "@/components/modals/ScheduleSettingsModal";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { hourLabel } from "@/lib/planner/time";
import {
  eventColorValue,
  eventsForDay,
  fromMinutes,
  layoutDay,
  timeRangeLabel,
  toMinutes,
  type CalendarEvent,
} from "@/lib/planner/events";

/** Pixel height of one hour in the timeline. */
const HOUR_PX = 48;
const SNAP_MINUTES = 30;

type ModalState =
  | { mode: "new"; start: string; end: string }
  | { mode: "edit"; event: CalendarEvent; dayKey: string }
  | null;

function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export function Schedule() {
  const { plannerDay, events, saveEvent, deleteEvent, scheduleHours } = usePlanner();
  const dayKey = plannerDay.toDateString();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Start (minutes) of the empty half-hour slot under the pointer, if any. */
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const now = useMinuteClock();

  const { start, end } = scheduleHours;
  const winStart = start * 60;
  const winEnd = (end + 1) * 60;
  const hours = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const dayEvents = eventsForDay(events, dayKey);
  const visible = dayEvents.filter((e) => toMinutes(e.end) > winStart && toMinutes(e.start) < winEnd);
  const hiddenCount = dayEvents.length - visible.length;
  const placed = layoutDay(visible);

  const isToday = dayKey === now.toDateString();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNow = isToday && nowMinutes >= winStart && nowMinutes < winEnd;

  // Open scrolled to "now" on today, else the first event, else the top.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const first = eventsForDay(events, dayKey).find((e) => toMinutes(e.end) > winStart);
    const focus = isToday ? nowMinutes : first ? toMinutes(first.start) : winStart;
    el.scrollTop = Math.max(0, ((focus - winStart) / 60 - 1) * HOUR_PX);
    // Only when the day or window changes, not on every edit or clock tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, winStart]);

  function slotAt(clientY: number, grid: HTMLElement) {
    const y = clientY - grid.getBoundingClientRect().top;
    const minutes = winStart + Math.floor(((y / HOUR_PX) * 60) / SNAP_MINUTES) * SNAP_MINUTES;
    return Math.min(Math.max(minutes, winStart), winEnd - SNAP_MINUTES);
  }

  function openNewAt(clientY: number, grid: HTMLElement) {
    const startAt = slotAt(clientY, grid);
    setHoverSlot(null);
    setModal({ mode: "new", start: fromMinutes(startAt), end: fromMinutes(startAt + 60) });
  }

  const defaultStart = Math.min(Math.max(9 * 60, winStart), winEnd - 60);

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <div className="planner-card-title">⏱ Schedule</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: "0.68rem", padding: "3px 8px" }}
            onClick={() =>
              setModal({ mode: "new", start: fromMinutes(defaultStart), end: fromMinutes(defaultStart + 60) })
            }
          >
            + Event
          </button>
          <button
            type="button"
            className="sidebar-icon-btn"
            style={{ marginLeft: 0 }}
            onClick={() => setSettingsOpen(true)}
            aria-label="Schedule settings"
            title="Schedule settings"
          >
            <SettingsIcon name="moreHorizontal" size={16} />
          </button>
        </div>
      </div>
      <div className="planner-card-body">
        {hiddenCount > 0 && (
          <button type="button" className="schedule-hidden-note" onClick={() => setSettingsOpen(true)}>
            {hiddenCount} event{hiddenCount === 1 ? "" : "s"} outside {hourLabel(start)} – {hourLabel(end)}
          </button>
        )}

        <div className="timeline-scroll" ref={scrollRef}>
          <div className="timeline" style={{ height: hours.length * HOUR_PX }}>
            <div className="timeline-labels">
              {hours.map((h) => (
                <div key={h} className="timeline-label" style={{ height: HOUR_PX }}>
                  {hourLabel(h)}
                </div>
              ))}
            </div>

            <div
              className="timeline-grid"
              role="grid"
              aria-label={`Schedule for ${plannerDay.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`}
              onClick={(e) => openNewAt(e.clientY, e.currentTarget)}
              onMouseMove={(e) => {
                // No hint over existing events: clicking those edits them.
                const overEvent = (e.target as Element).closest(".timeline-event");
                const next = overEvent ? null : slotAt(e.clientY, e.currentTarget);
                if (next !== hoverSlot) setHoverSlot(next);
              }}
              onMouseLeave={() => setHoverSlot(null)}
            >
              {hours.map((h) => (
                <div key={h} className="timeline-hour" style={{ height: HOUR_PX }} />
              ))}

              {placed.map(({ event: ev, column, columns }) => {
                const s = Math.max(toMinutes(ev.start), winStart);
                const e = Math.min(toMinutes(ev.end), winEnd);
                const height = Math.max(((e - s) / 60) * HOUR_PX - 2, 18);
                const compact = height < 38;
                const color = eventColorValue(ev.color);
                const style: CSSProperties = {
                  top: ((s - winStart) / 60) * HOUR_PX + 1,
                  height,
                  left: `calc(${(column / columns) * 100}% + 2px)`,
                  width: `calc(${100 / columns}% - 4px)`,
                  ["--event-color" as string]: color,
                };
                return (
                  <button
                    key={`${ev.id}-${ev.dayKey}`}
                    type="button"
                    className={`timeline-event${compact ? " compact" : ""}`}
                    style={style}
                    title={`${ev.title} · ${timeRangeLabel(ev.start, ev.end)}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setModal({ mode: "edit", event: ev, dayKey });
                    }}
                  >
                    <span className="timeline-event-title">
                      {ev.ai && <SettingsIcon name="sparkles" size={10} />}
                      {ev.repeat !== "none" && <SettingsIcon name="repeat" size={10} />}
                      {ev.title}
                    </span>
                    <span className="timeline-event-time">{timeRangeLabel(ev.start, ev.end)}</span>
                  </button>
                );
              })}

              {hoverSlot !== null && (
                <div
                  className="timeline-ghost"
                  style={{
                    top: ((hoverSlot - winStart) / 60) * HOUR_PX + 1,
                    height: (Math.min(60, winEnd - hoverSlot) / 60) * HOUR_PX - 2,
                  }}
                  aria-hidden="true"
                >
                  <SettingsIcon name="plus" size={11} /> Add event · {timeRangeLabel(fromMinutes(hoverSlot), fromMinutes(hoverSlot + 60))}
                </div>
              )}

              {showNow && (
                <div className="timeline-now" style={{ top: ((nowMinutes - winStart) / 60) * HOUR_PX }} aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </div>

      <ScheduleSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <EventModal
        open={modal !== null}
        event={modal?.mode === "edit" ? modal.event : undefined}
        defaults={{
          day: dayKey,
          start: modal?.mode === "new" ? modal.start : "09:00",
          end: modal?.mode === "new" ? modal.end : "10:00",
        }}
        onCancel={() => setModal(null)}
        onSave={(draft) => {
          const existing = modal?.mode === "edit" ? modal.event : undefined;
          saveEvent({
            ...draft,
            id: existing?.id,
            exceptions: existing?.exceptions ?? [],
            ai: existing?.ai ?? false,
          });
          setModal(null);
        }}
        onDelete={(scope) => {
          if (modal?.mode === "edit") {
            deleteEvent(modal.event.id, scope === "one" ? modal.dayKey : undefined);
          }
          setModal(null);
        }}
      />
    </div>
  );
}
