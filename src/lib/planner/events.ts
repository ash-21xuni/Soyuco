import { normalizeRepeat, parseDbDate, repeatMatches, startOfDay, type Repeat } from "./recurrence";
import type { PlanCategory } from "@/lib/ai/types";

export type EventColor =
  | "tomato"
  | "flamingo"
  | "tangerine"
  | "banana"
  | "sage"
  | "basil"
  | "peacock"
  | "blueberry"
  | "lavender"
  | "grape"
  | "graphite";

export const EVENT_COLORS: { id: EventColor; label: string; value: string }[] = [
  { id: "tomato", label: "Tomato", value: "#d50000" },
  { id: "flamingo", label: "Flamingo", value: "#e67c73" },
  { id: "tangerine", label: "Tangerine", value: "#f4511e" },
  { id: "banana", label: "Banana", value: "#f6bf26" },
  { id: "sage", label: "Sage", value: "#33b679" },
  { id: "basil", label: "Basil", value: "#0b8043" },
  { id: "peacock", label: "Peacock", value: "#039be5" },
  { id: "blueberry", label: "Blueberry", value: "#3f51b5" },
  { id: "lavender", label: "Lavender", value: "#7986cb" },
  { id: "grape", label: "Grape", value: "#8e24aa" },
  { id: "graphite", label: "Graphite", value: "#616161" },
];

export const DEFAULT_EVENT_COLOR: EventColor = "peacock";

const COLOR_VALUES = Object.fromEntries(EVENT_COLORS.map((c) => [c.id, c.value])) as Record<
  EventColor,
  string
>;

export function eventColorValue(color: EventColor) {
  return COLOR_VALUES[color] ?? COLOR_VALUES[DEFAULT_EVENT_COLOR];
}

/** Colours for AI-planned blocks, by the plan's category. */
export const AI_CATEGORY_COLOR: Record<PlanCategory, EventColor> = {
  work: "blueberry",
  focus: "grape",
  health: "sage",
  personal: "tangerine",
};

export type CalendarEvent = {
  id: number;
  title: string;
  /** Day key of the first (or only) occurrence. */
  day: string;
  /** "HH:MM", 24-hour. */
  start: string;
  /** "HH:MM", after `start`, same day. */
  end: string;
  color: EventColor;
  repeat: Repeat;
  /** Weekdays (0 = Sun) for a "custom" repeat. */
  repeatDays: number[];
  /** Every N weeks, for a "custom" repeat. */
  repeatInterval: number;
  /** "YYYY-MM-DD" last day a repeating event can occur, or null for forever. */
  repeatUntil: string | null;
  /** Day keys removed from a repeating series ("delete this event"). */
  exceptions: string[];
  ai: boolean;
};

export type EventOccurrence = CalendarEvent & { dayKey: string };

export function normalizeEvent(
  raw: Partial<CalendarEvent> & Pick<CalendarEvent, "id" | "title" | "day">,
): CalendarEvent {
  const rule = normalizeRepeat(raw, raw.day);
  return {
    id: raw.id,
    title: raw.title,
    day: raw.day,
    start: raw.start ?? "09:00",
    end: raw.end ?? "10:00",
    color: raw.color && raw.color in COLOR_VALUES ? raw.color : DEFAULT_EVENT_COLOR,
    ...rule,
    repeatUntil: rule.repeat === "none" ? null : (raw.repeatUntil ?? null),
    exceptions: raw.exceptions ?? [],
    ai: raw.ai ?? false,
  };
}

export function eventOccursOn(ev: CalendarEvent, dayKey: string) {
  if (ev.exceptions.includes(dayKey)) return false;
  if (ev.repeatUntil && startOfDay(new Date(dayKey)) > parseDbDate(ev.repeatUntil)) return false;
  return repeatMatches(ev, ev.day, dayKey);
}

export function eventsForDay(events: CalendarEvent[], dayKey: string): EventOccurrence[] {
  return events
    .filter((ev) => eventOccursOn(ev, dayKey))
    .map((ev) => ({ ...ev, dayKey }))
    .sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end));
}

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number) {
  const clamped = Math.max(0, Math.min(total, 23 * 60 + 59));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function clock(hhmm: string, withMeridiem: boolean) {
  const [h, m] = hhmm.split(":").map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const mins = m ? `:${String(m).padStart(2, "0")}` : "";
  return `${hour12}${mins}${withMeridiem ? (h < 12 ? "am" : "pm") : ""}`;
}

/** "9 – 10am", "9:30am – 1pm" (meridiem shown once when both sides share it). */
export function timeRangeLabel(start: string, end: string) {
  const samePeriod = toMinutes(start) < 720 === toMinutes(end) < 720;
  return `${clock(start, !samePeriod)} – ${clock(end, true)}`;
}

export type PlacedEvent = { event: EventOccurrence; column: number; columns: number };

/**
 * Google-Calendar-style layout: overlapping events share the width in
 * columns; each group of mutually overlapping events is laid out together.
 */
export function layoutDay(occurrences: EventOccurrence[]): PlacedEvent[] {
  const sorted = [...occurrences].sort(
    (a, b) => toMinutes(a.start) - toMinutes(b.start) || toMinutes(b.end) - toMinutes(a.end),
  );
  const placed: PlacedEvent[] = [];
  let group: PlacedEvent[] = [];
  let groupEnd = -1;
  let columnEnds: number[] = [];

  const closeGroup = () => {
    for (const p of group) p.columns = columnEnds.length;
    placed.push(...group);
    group = [];
    columnEnds = [];
  };

  for (const ev of sorted) {
    const start = toMinutes(ev.start);
    const end = Math.max(toMinutes(ev.end), start + 15);
    if (group.length && start >= groupEnd) closeGroup();
    let column = columnEnds.findIndex((colEnd) => colEnd <= start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[column] = end;
    }
    group.push({ event: ev, column, columns: 1 });
    groupEnd = Math.max(groupEnd, end);
  }
  closeGroup();
  return placed;
}

/** Converts the old one-event-per-hour map into calendar events. */
export function eventsFromLegacyMap(
  map: Record<string, Record<string, { text: string; ai?: boolean }>>,
): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (const [dayKey, hours] of Object.entries(map)) {
    for (const [hour, ev] of Object.entries(hours)) {
      if (!ev?.text?.trim()) continue;
      const h = Number(hour);
      const d = new Date(dayKey);
      out.push(
        normalizeEvent({
          // Same id the SQL migration generates (UTC-midnight epoch ms + hour),
          // so local and cloud copies of a migrated event match.
          id: Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + h,
          title: ev.text,
          day: dayKey,
          start: fromMinutes(h * 60),
          end: h >= 23 ? "23:59" : fromMinutes((h + 1) * 60),
          color: ev.ai ? "lavender" : DEFAULT_EVENT_COLOR,
          ai: ev.ai ?? false,
        }),
      );
    }
  }
  return out;
}
