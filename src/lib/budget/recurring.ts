// Date helpers and the schedule maths for recurring income and expenses.
// Dates are local "YYYY-MM-DD" strings, which also compare correctly as text.

export type Frequency = "weekly" | "biweekly" | "monthly" | "yearly";

export const FREQUENCIES: Frequency[] = ["weekly", "biweekly", "monthly", "yearly"];

export const FREQ_LABELS: Record<Frequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  yearly: "Yearly",
};

// How many times each frequency happens in an average month.
const PER_MONTH: Record<Frequency, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
  yearly: 1 / 12,
};

export type RecurringSchedule = {
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
};

const MS_DAY = 86400000;

export function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayStr() {
  return toDateStr(new Date());
}

export function addDays(s: string, n: number) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

// Whole days from a to b, immune to daylight-saving shifts.
function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / MS_DAY);
}

// The given day of a month, pulled back to the month's last day if needed
// (a bill on the 31st lands on the 30th in November).
function clampedDay(year: number, month: number, day: number) {
  const last = new Date(year, month + 1, 0).getDate();
  return toDateStr(new Date(year, month, Math.min(day, last)));
}

/** Every date the schedule falls on between `from` and `to`, inclusive. */
export function occurrencesBetween(rule: RecurringSchedule, from: string, to: string): string[] {
  const lo = from > rule.startDate ? from : rule.startDate;
  const hi = rule.endDate && rule.endDate < to ? rule.endDate : to;
  if (lo > hi) return [];

  const out: string[] = [];
  const start = parseDate(rule.startDate);

  if (rule.frequency === "weekly" || rule.frequency === "biweekly") {
    const step = rule.frequency === "weekly" ? 7 : 14;
    let date = addDays(rule.startDate, Math.ceil(daysBetween(rule.startDate, lo) / step) * step);
    while (date <= hi) {
      out.push(date);
      date = addDays(date, step);
    }
  } else if (rule.frequency === "monthly") {
    for (let key = monthKey(lo); key <= monthKey(hi); key = shiftMonth(key, 1)) {
      const [y, m] = key.split("-").map(Number);
      const date = clampedDay(y, m - 1, start.getDate());
      if (date >= lo && date <= hi) out.push(date);
    }
  } else {
    for (let y = parseDate(lo).getFullYear(); y <= parseDate(hi).getFullYear(); y++) {
      const date = clampedDay(y, start.getMonth(), start.getDate());
      if (date >= lo && date <= hi) out.push(date);
    }
  }
  return out;
}

/** The first date the schedule falls on after `after`, if any. */
export function nextOccurrence(rule: RecurringSchedule, after: string): string | null {
  return occurrencesBetween(rule, addDays(after, 1), addDays(after, 400))[0] ?? null;
}

/** The amount spread over an average month, e.g. weekly $100 ≈ $433/month. */
export function monthlyEquivalent(amount: number, frequency: Frequency) {
  return amount * PER_MONTH[frequency];
}

// Months are "YYYY-MM" keys.
export function monthKey(date: string) {
  return date.slice(0, 7);
}

export function shiftMonth(key: string, n: number) {
  const [y, m] = key.split("-").map(Number);
  return toDateStr(new Date(y, m - 1 + n, 1)).slice(0, 7);
}

export function monthBounds(key: string) {
  const [y, m] = key.split("-").map(Number);
  return { first: `${key}-01`, last: toDateStr(new Date(y, m, 0)) };
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Months from the one after `fromKey` up to and including `toKey`. */
export function monthsAfter(fromKey: string, toKey: string) {
  const out: string[] = [];
  for (let k = shiftMonth(fromKey, 1); k <= toKey; k = shiftMonth(k, 1)) out.push(k);
  return out;
}

export function shortDate(date: string) {
  return parseDate(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Today", "Tomorrow", "In 5 days" or a short date for anything further off. */
export function relativeDay(date: string, today: string) {
  const days = daysBetween(today, date);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1 && days < 14) return `In ${days} days`;
  return shortDate(date);
}
