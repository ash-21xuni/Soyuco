"use client";

import type { CSSProperties } from "react";
import {
  MAX_REPEAT_INTERVAL,
  REPEAT_OPTIONS,
  WEEKDAY_INITIALS,
  WEEKDAY_SHORT,
  type Repeat,
  type RepeatRule,
} from "@/lib/planner/recurrence";

// Shared by the task and event forms. The select and the custom panel are
// separate so a form can put the panel on its own full-width row.

export function RepeatSelect({
  id,
  rule,
  startDay,
  disabled,
  style,
  onChange,
}: {
  id: string;
  rule: RepeatRule;
  /** Day key the repeat starts from; its weekday seeds a new custom rule. */
  startDay: string;
  disabled?: boolean;
  style?: CSSProperties;
  onChange: (rule: RepeatRule) => void;
}) {
  return (
    <select
      id={id}
      value={rule.repeat}
      disabled={disabled}
      onChange={(e) => {
        const repeat = e.target.value as Repeat;
        onChange(
          repeat === "custom"
            ? {
                repeat,
                repeatDays: rule.repeatDays.length ? rule.repeatDays : [new Date(startDay).getDay()],
                repeatInterval: rule.repeatInterval || 1,
              }
            : { repeat, repeatDays: [], repeatInterval: 1 },
        );
      }}
      style={style}
    >
      {REPEAT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function CustomRepeatFields({
  rule,
  onChange,
}: {
  rule: RepeatRule;
  onChange: (rule: RepeatRule) => void;
}) {
  if (rule.repeat !== "custom") return null;

  function toggleDay(day: number) {
    const has = rule.repeatDays.includes(day);
    // Keep at least one day selected.
    if (has && rule.repeatDays.length === 1) return;
    const repeatDays = has
      ? rule.repeatDays.filter((d) => d !== day)
      : [...rule.repeatDays, day].sort();
    onChange({ ...rule, repeatDays });
  }

  return (
    <div className="custom-repeat">
      <div className="custom-repeat-every">
        <span>Repeat every</span>
        <input
          type="number"
          min={1}
          max={MAX_REPEAT_INTERVAL}
          aria-label="Number of weeks between repeats"
          value={rule.repeatInterval}
          onChange={(e) =>
            onChange({
              ...rule,
              repeatInterval: Math.min(Math.max(Number(e.target.value) || 1, 1), MAX_REPEAT_INTERVAL),
            })
          }
        />
        <span>{rule.repeatInterval === 1 ? "week" : "weeks"} on</span>
      </div>
      <div className="custom-repeat-days" role="group" aria-label="Repeat on">
        {WEEKDAY_INITIALS.map((initial, day) => {
          const on = rule.repeatDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              className={`custom-repeat-day${on ? " on" : ""}`}
              aria-pressed={on}
              aria-label={WEEKDAY_SHORT[day]}
              title={WEEKDAY_SHORT[day]}
              onClick={() => toggleDay(day)}
            >
              {initial}
            </button>
          );
        })}
      </div>
    </div>
  );
}
