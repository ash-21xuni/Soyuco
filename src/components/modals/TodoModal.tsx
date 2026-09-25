"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import type { Priority, TodoDetails } from "@/lib/planner/planner-context";
import type { RepeatRule } from "@/lib/planner/recurrence";
import { CustomRepeatFields, RepeatSelect } from "@/components/planner/RepeatPicker";
import { SettingsIcon } from "@/components/settings/SettingsIcon";

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
};

const EMPTY_DETAILS: TodoDetails = {
  dueDate: null,
  dueTime: null,
  repeat: "none",
  repeatDays: [],
  repeatInterval: 1,
};
const NO_REPEAT: RepeatRule = { repeat: "none", repeatDays: [], repeatInterval: 1 };

function ruleOf(d: TodoDetails): RepeatRule {
  return { repeat: d.repeat, repeatDays: d.repeatDays, repeatInterval: d.repeatInterval };
}

export function TodoModal({
  open,
  isEdit,
  initialText,
  initialPriority,
  initialDetails = EMPTY_DETAILS,
  startDay,
  onCancel,
  onSave,
  onDelete,
}: {
  open: boolean;
  isEdit: boolean;
  initialText: string;
  initialPriority: Priority;
  initialDetails?: TodoDetails;
  /** Day key the task starts on; seeds the weekday of a new custom repeat. */
  startDay: string;
  onCancel: () => void;
  onSave: (text: string, priority: Priority, details: TodoDetails) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(initialText);
  const [priority, setPriority] = useState<Priority>(initialPriority);
  const [dueDate, setDueDate] = useState(initialDetails.dueDate ?? "");
  const [dueTime, setDueTime] = useState(initialDetails.dueTime ?? "");
  const [rule, setRule] = useState<RepeatRule>(ruleOf(initialDetails));
  const inputRef = useRef<HTMLInputElement>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setText(initialText);
      setPriority(initialPriority);
      setDueDate(initialDetails.dueDate ?? "");
      setDueTime(initialDetails.dueTime ?? "");
      setRule(ruleOf(initialDetails));
    }
  }

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEscapeToClose(open, onCancel);
  if (!open) return null;

  const hasDeadline = !!dueDate;
  const repeats = rule.repeat !== "none";

  function save() {
    // A deadline means "show every day until then", so it replaces repeating.
    onSave(text, priority, {
      dueDate: dueDate || null,
      dueTime: dueDate ? dueTime || null : null,
      ...(dueDate ? NO_REPEAT : rule),
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
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          width: 420,
          maxWidth: "94vw",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text)", fontStyle: "italic" }}
          >
            {isEdit ? "Edit Task" : "Add Task"}
          </div>
          <button className="close-btn" onClick={onCancel} aria-label="Close">
            <SettingsIcon name="close" size={14} />
          </button>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={labelStyle} htmlFor="todo-text">
              Task
            </label>
            <input
              id="todo-text"
              ref={inputRef}
              type="text"
              placeholder="What needs to be done?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              style={fieldStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={labelStyle} htmlFor="todo-priority">
                Priority
              </label>
              <select
                id="todo-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                style={{ ...fieldStyle, cursor: "pointer" }}
              >
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={labelStyle} htmlFor="todo-repeat">
                Repeat
              </label>
              <RepeatSelect
                id="todo-repeat"
                rule={hasDeadline ? NO_REPEAT : rule}
                startDay={startDay}
                disabled={hasDeadline}
                onChange={setRule}
                style={{ ...fieldStyle, cursor: hasDeadline ? "not-allowed" : "pointer", opacity: hasDeadline ? 0.55 : 1 }}
              />
            </div>
          </div>

          {!hasDeadline && <CustomRepeatFields rule={rule} onChange={setRule} />}

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={labelStyle}>Deadline (optional)</span>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="date"
                aria-label="Deadline date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (e.target.value) setRule(NO_REPEAT);
                }}
                style={{ ...fieldStyle, flex: 1 }}
              />
              <input
                type="time"
                aria-label="Deadline time"
                value={dueTime}
                disabled={!hasDeadline}
                onChange={(e) => setDueTime(e.target.value)}
                style={{ ...fieldStyle, opacity: hasDeadline ? 1 : 0.55 }}
              />
              {(dueDate || dueTime) && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setDueDate("");
                    setDueTime("");
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.7rem", color: "var(--text3)" }}>
              {hasDeadline
                ? "Shows every day until the deadline, then turns red as overdue. Leave the time empty for end of day."
                : repeats
                  ? "Repeating tasks can't have a deadline. Pick a date to replace the repeat."
                  : "Add a date to keep this task on your list every day until it's due."}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            padding: "14px 20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {isEdit ? (
            <button className="btn" style={{ color: "var(--danger)", border: "1px solid var(--danger)" }} onClick={onDelete}>
              <SettingsIcon name="trash" size={14} /> {repeats ? "Delete series" : "Delete"}
            </button>
          ) : (
            <div />
          )}
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <button className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save}>
              {isEdit ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
