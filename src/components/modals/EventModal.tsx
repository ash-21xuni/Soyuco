"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import {
  DEFAULT_EVENT_COLOR,
  EVENT_COLORS,
  fromMinutes,
  toMinutes,
  type CalendarEvent,
  type EventColor,
} from "@/lib/planner/events";
import { parseDbDate, toDbDate, type RepeatRule } from "@/lib/planner/recurrence";
import { CustomRepeatFields, RepeatSelect } from "@/components/planner/RepeatPicker";

export type EventDraft = Omit<CalendarEvent, "id" | "exceptions" | "ai">;

const labelStyle: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "var(--text3)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const fieldStyle: CSSProperties = {
  padding: "8px 12px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontFamily: "var(--font-ui)",
  fontSize: "0.85rem",
  color: "var(--text)",
  colorScheme: "light dark",
  minWidth: 0,
};

// Create (no `event`) or edit an event. Edits to a repeating event apply to
// the whole series; deleting offers "this event" or "all events".
export function EventModal({
  open,
  event,
  defaults,
  onCancel,
  onSave,
  onDelete,
}: {
  open: boolean;
  event?: CalendarEvent;
  /** Starting values for a new event (day key and times). */
  defaults: { day: string; start: string; end: string };
  onCancel: () => void;
  onSave: (draft: EventDraft) => void;
  onDelete: (scope: "one" | "all") => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [color, setColor] = useState<EventColor>(DEFAULT_EVENT_COLOR);
  const [rule, setRule] = useState<RepeatRule>({ repeat: "none", repeatDays: [], repeatInterval: 1 });
  const [until, setUntil] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTitle(event?.title ?? "");
      setDate(toDbDate(event?.day ?? defaults.day));
      setStart(event?.start ?? defaults.start);
      setEnd(event?.end ?? defaults.end);
      setColor(event?.color ?? DEFAULT_EVENT_COLOR);
      setRule({
        repeat: event?.repeat ?? "none",
        repeatDays: event?.repeatDays ?? [],
        repeatInterval: event?.repeatInterval ?? 1,
      });
      setUntil(event?.repeatUntil ?? "");
    }
  }

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEscapeToClose(open, onCancel);
  if (!open) return null;

  const isEdit = !!event;
  const repeats = rule.repeat !== "none";
  const timeError = start && end && toMinutes(end) <= toMinutes(start) ? "End time must be after the start." : "";
  const untilError = repeats && until && date && until < date ? "The repeat can't end before the first event." : "";
  const canSave = !!title.trim() && !!date && !timeError && !untilError;

  function changeStart(value: string) {
    // Like Google Calendar: moving the start keeps the event's length.
    const length = Math.max(toMinutes(end) - toMinutes(start), 15);
    setStart(value);
    if (value) setEnd(fromMinutes(toMinutes(value) + length));
  }

  function save() {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      day: parseDbDate(date).toDateString(),
      start,
      end,
      color,
      ...rule,
      repeatUntil: repeats && until ? until : null,
    });
  }

  return (
    <div
      style={{
        display: "flex",
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.55)",
        zIndex: 300,
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit event" : "Add event"}
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          width: 440,
          maxWidth: "94vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
          borderTop: `4px solid ${EVENT_COLORS.find((c) => c.id === color)?.value}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text)", fontStyle: "italic" }}>
            {isEdit ? "Edit Event" : "Add Event"}
          </div>
          <button className="close-btn" onClick={onCancel} aria-label="Close">
            <SettingsIcon name="close" size={14} />
          </button>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            ref={inputRef}
            type="text"
            aria-label="Title"
            placeholder="Add title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            style={{ ...fieldStyle, fontSize: "1rem", padding: "10px 12px" }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={labelStyle}>When</span>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 8 }}>
              <input type="date" aria-label="Date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldStyle} />
              <input type="time" aria-label="Start time" step={300} value={start} onChange={(e) => changeStart(e.target.value)} style={fieldStyle} />
              <input type="time" aria-label="End time" step={300} value={end} onChange={(e) => setEnd(e.target.value)} style={fieldStyle} />
            </div>
            {timeError && <span className="event-form-error">{timeError}</span>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: repeats ? "1fr 1fr" : "1fr", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={labelStyle} htmlFor="event-repeat">
                Repeat
              </label>
              <RepeatSelect
                id="event-repeat"
                rule={rule}
                startDay={date ? parseDbDate(date).toDateString() : defaults.day}
                onChange={setRule}
                style={{ ...fieldStyle, cursor: "pointer" }}
              />
            </div>
            {repeats && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={labelStyle} htmlFor="event-until">
                  Ends
                </label>
                <input
                  id="event-until"
                  type="date"
                  value={until}
                  min={date}
                  onChange={(e) => setUntil(e.target.value)}
                  style={fieldStyle}
                />
              </div>
            )}
          </div>
          <CustomRepeatFields rule={rule} onChange={setRule} />
          {repeats && (
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.7rem", color: "var(--text3)", marginTop: -8 }}>
              {until ? "Repeats until the end date, then stops." : "Leave “Ends” empty to repeat forever."}
              {isEdit && " Changes apply to every event in this series."}
            </span>
          )}
          {untilError && <span className="event-form-error">{untilError}</span>}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>Colour</span>
            <div className="event-colors" role="radiogroup" aria-label="Colour">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={color === c.id}
                  aria-label={c.label}
                  title={c.label}
                  className={`event-color${color === c.id ? " active" : ""}`}
                  style={{ background: c.value }}
                  onClick={() => setColor(c.id)}
                >
                  {color === c.id && <SettingsIcon name="check" size={12} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            padding: "14px 20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {isEdit ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" style={{ color: "var(--danger)", border: "1px solid var(--danger)" }} onClick={() => onDelete("one")}>
                <SettingsIcon name="trash" size={14} /> {event.repeat !== "none" ? "This event" : "Delete"}
              </button>
              {event.repeat !== "none" && (
                <button className="btn" style={{ color: "var(--danger)", border: "1px solid var(--danger)" }} onClick={() => onDelete("all")}>
                  All events
                </button>
              )}
            </div>
          ) : (
            <div />
          )}
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <button className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save} disabled={!canSave} style={{ opacity: canSave ? 1 : 0.55 }}>
              {isEdit ? "Save" : "Add Event"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
