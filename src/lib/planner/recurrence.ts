// Repeat rules shared by tasks and calendar events.

export type Repeat = "none" | "daily" | "weekdays" | "weekly" | "monthly" | "custom";

/**
 * How something repeats. `repeatDays` (0 = Sun … 6 = Sat) and
 * `repeatInterval` (every N weeks) only apply to "custom", like Google
 * Calendar's "Repeat every N weeks on …".
 */
export type RepeatRule = { repeat: Repeat; repeatDays: number[]; repeatInterval: number };

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];
export const MAX_REPEAT_INTERVAL = 52;

export const REPEAT_OPTIONS: { value: Repeat; label: string }[] = [
  { value: "none", label: "Doesn't repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Every weekday (Mon–Fri)" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
  { value: "custom", label: "Custom…" },
];

const REPEAT_SHORT: Record<Exclude<Repeat, "custom">, string> = {
  none: "",
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Weekly",
  monthly: "Monthly",
};

/**
 * Fills in rule fields for older data and keeps custom rules valid: at least
 * one weekday (defaulting to the start day's) and an interval of 1–52 weeks.
 */
export function normalizeRepeat(
  raw: Partial<RepeatRule>,
  startKey: string,
): RepeatRule {
  const repeat = raw.repeat ?? "none";
  if (repeat !== "custom") return { repeat, repeatDays: [], repeatInterval: 1 };
  const days = [...new Set((raw.repeatDays ?? []).filter((d) => d >= 0 && d <= 6))].sort();
  return {
    repeat,
    repeatDays: days.length ? days : [new Date(startKey).getDay()],
    repeatInterval: Math.min(Math.max(Math.round(raw.repeatInterval ?? 1), 1), MAX_REPEAT_INTERVAL),
  };
}

/** Short badge text: "Weekly", "Mon, Wed, Fri", "Every 2 weeks · Tue". */
export function repeatLabel(rule: RepeatRule) {
  if (rule.repeat !== "custom") return REPEAT_SHORT[rule.repeat];
  const days = rule.repeatDays;
  const every = rule.repeatInterval > 1 ? `Every ${rule.repeatInterval} weeks · ` : "";
  if (days.length === 7) return every ? `Every ${rule.repeatInterval} weeks · daily` : "Daily";
  if (!every && days.join() === "1,2,3,4,5") return "Weekdays";
  return every + days.map((d) => WEEKDAY_SHORT[d]).join(", ");
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** "YYYY-MM-DD" -> local Date at midnight. */
export function parseDbDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Fri Sep 25 2026" (the planner's day key) -> "2026-09-25" for Postgres `date`. */
export function toDbDate(dayKey: string) {
  const d = new Date(dayKey);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Sunday at midnight of the week containing `d`. */
function weekOf(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
}

/**
 * Whether something that starts on `startKey` and repeats by `rule` lands on
 * `dayKey`. Days before the start never match.
 */
export function repeatMatches(rule: RepeatRule, startKey: string, dayKey: string) {
  const day = startOfDay(new Date(dayKey));
  const start = startOfDay(new Date(startKey));
  if (day < start) return false;

  switch (rule.repeat) {
    case "custom": {
      if (!rule.repeatDays.includes(day.getDay())) return false;
      // Round: DST changes make some weeks an hour short or long.
      const weeks = Math.round((weekOf(day).getTime() - weekOf(start).getTime()) / WEEK_MS);
      return weeks % rule.repeatInterval === 0;
    }
    case "none":
      return day.getTime() === start.getTime();
    case "daily":
      return true;
    case "weekdays":
      return day.getDay() >= 1 && day.getDay() <= 5;
    case "weekly":
      return day.getDay() === start.getDay();
    case "monthly": {
      // Started on the 31st? Land on the last day of shorter months.
      const lastOfMonth = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate();
      return day.getDate() === Math.min(start.getDate(), lastOfMonth);
    }
  }
}
