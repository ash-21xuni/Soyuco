export function hourLabel(h: number) {
  if (h === 0) return "12am";
  return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

/** Default schedule window: first and last hour slots shown. */
export const DEFAULT_SCHEDULE_HOURS = { start: 6, end: 21 };

/** Sunday of the week containing `d` (the habit grid runs Sun–Sat), as "YYYY-MM-DD". */
export function weekStartKey(d = new Date()) {
  const sunday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
  const mm = String(sunday.getMonth() + 1).padStart(2, "0");
  const dd = String(sunday.getDate()).padStart(2, "0");
  return `${sunday.getFullYear()}-${mm}-${dd}`;
}
