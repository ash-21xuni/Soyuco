import type { Todo } from "./planner-context";

export type Repeat = "none" | "daily" | "weekdays" | "weekly" | "monthly";

export const REPEAT_OPTIONS: { value: Repeat; label: string }[] = [
  { value: "none", label: "Doesn't repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Every weekday (Mon–Fri)" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
];

export const REPEAT_SHORT: Record<Repeat, string> = {
  none: "",
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Weekly",
  monthly: "Monthly",
};

/** A task as it appears on one particular day. */
export type TaskOccurrence = Todo & { dayKey: string; doneOnDay: boolean };

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** "Fri Sep 25 2026" (the planner's day key) -> "2026-09-25" for Postgres `date`. */
export function toDbDate(dayKey: string) {
  const d = new Date(dayKey);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Fills in fields missing from older tasks and enforces the rules: a deadline
 * and a repeat are mutually exclusive, and a time only makes sense with a date.
 */
export function normalizeTodo(raw: Partial<Todo> & Pick<Todo, "id" | "text" | "day">): Todo {
  const dueDate = raw.dueDate ?? null;
  return {
    id: raw.id,
    text: raw.text,
    day: raw.day,
    done: raw.done ?? false,
    priority: raw.priority ?? "med",
    dueDate,
    dueTime: dueDate ? (raw.dueTime ?? null) : null,
    repeat: dueDate ? "none" : (raw.repeat ?? "none"),
    doneDates: raw.doneDates ?? [],
  };
}

function parseDbDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Whether a task shows up on `dayKey`:
 * - with a deadline: every day from its own day until the deadline, and on
 *   today as well while it is unfinished and overdue;
 * - repeating: on each matching day from its own day onwards;
 * - otherwise: only on its own day.
 */
export function occursOn(todo: Todo, dayKey: string) {
  const day = startOfDay(new Date(dayKey));
  const start = startOfDay(new Date(todo.day));
  if (day < start) return false;

  if (todo.dueDate) {
    const due = parseDbDate(todo.dueDate);
    if (day <= due) return true;
    const today = startOfDay(new Date());
    return !todo.done && day.getTime() === today.getTime();
  }

  if (todo.repeat === "none") return todo.day === dayKey;

  switch (todo.repeat) {
    case "daily":
      return true;
    case "weekdays":
      return day.getDay() >= 1 && day.getDay() <= 5;
    case "weekly":
      return day.getDay() === start.getDay();
    case "monthly": {
      // Tasks started on the 31st land on the last day of shorter months.
      const lastOfMonth = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate();
      return day.getDate() === Math.min(start.getDate(), lastOfMonth);
    }
  }
}

export function isDoneOn(todo: Todo, dayKey: string) {
  return todo.repeat === "none" ? todo.done : todo.doneDates.includes(dayKey);
}

export function tasksForDay(todos: Todo[], dayKey: string): TaskOccurrence[] {
  return todos
    .filter((t) => occursOn(t, dayKey))
    .map((t) => ({ ...t, dayKey, doneOnDay: isDoneOn(t, dayKey) }));
}

/** When a task is due: its deadline date at the due time, or end of that day. */
export function deadlineOf(task: Todo): Date | null {
  if (!task.dueDate) return null;
  const due = parseDbDate(task.dueDate);
  const [h, m] = (task.dueTime ?? "23:59").split(":").map(Number);
  due.setHours(h, m);
  return due;
}

export type DeadlineState = "overdue" | "soon" | "upcoming";

const SOON_MS = 24 * 60 * 60 * 1000;

export function deadlineState(due: Date, now = new Date()): DeadlineState {
  const diff = due.getTime() - now.getTime();
  if (diff < 0) return "overdue";
  if (diff < SOON_MS) return "soon";
  return "upcoming";
}

function timeLabel(d: Date) {
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined })
    .replace(" ", "")
    .toLowerCase();
}

/** "today", "Fri 2 Oct" or "Fri 2 Oct, 9:30am", relative to the day being viewed. */
export function deadlineWhen(task: TaskOccurrence, due: Date) {
  const sameDay = startOfDay(due).getTime() === startOfDay(new Date(task.dayKey)).getTime();
  const datePart = sameDay
    ? "today"
    : due.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return task.dueTime ? `${datePart}, ${timeLabel(due)}` : datePart;
}
