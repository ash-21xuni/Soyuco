"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { normalizeTodo, toDbDate, type Repeat } from "@/lib/planner/tasks";
import { reportWrite } from "@/lib/supabase/write";
import { DEFAULT_SCHEDULE_HOURS, weekStartKey } from "@/lib/planner/time";
import { eventsFromLegacyMap, normalizeEvent, type CalendarEvent } from "@/lib/planner/events";

export type Priority = "high" | "med" | "low";
export type Todo = {
  id: number;
  text: string;
  /** One-off tasks only; repeating tasks track completion per day in doneDates. */
  done: boolean;
  priority: Priority;
  /** The day the task was added to; repeats count from here. */
  day: string;
  /** "YYYY-MM-DD" deadline for one-off tasks. */
  dueDate: string | null;
  /** "HH:MM" deadline time (per occurrence for repeating tasks). */
  dueTime: string | null;
  repeat: Repeat;
  /** Weekdays (0 = Sun) for a "custom" repeat. */
  repeatDays: number[];
  /** Every N weeks, for a "custom" repeat. */
  repeatInterval: number;
  /** Day keys on which a repeating task was completed. */
  doneDates: string[];
};
export type TodoDetails = Pick<Todo, "dueDate" | "dueTime" | "repeat" | "repeatDays" | "repeatInterval">;
export type Habit = { id: number; name: string; days: boolean[] };
/** Snapshot of a finished week, saved just before a weekly reset clears it. */
export type HabitWeek = { weekStart: string; habits: Habit[] };
export type MoodHistory = Record<string, number>;

const TODOS_KEY = "soyuco_todos";
const HABITS_KEY = "soyuco_habits";
const HABIT_HISTORY_KEY = "soyuco_habit_history";
const HISTORY_WEEKS_KEPT = 104;
/** Pre-calendar storage: one text event per hour slot. Read once to migrate. */
const LEGACY_EVENTS_KEY = "soyuco_events";
const EVENTS_KEY = "soyuco_calendar_events";
const MOOD_KEY = "soyuco_mood";

const DEFAULT_HABITS: Habit[] = [
  { id: 1, name: "Morning pages", days: [false, false, false, false, false, false, false] },
  { id: 2, name: "Exercise", days: [false, false, false, false, false, false, false] },
  { id: 3, name: "Meditate", days: [false, false, false, false, false, false, false] },
];

// Postgres `date` columns come back as "YYYY-MM-DD" (or a full timestamp),
// which no longer matches the `toDateString()` keys used everywhere locally.
// Reconstruct the local calendar date from the Y-M-D components directly so
// the round trip never gets shifted by UTC-vs-local parsing.
function localDateKeyFromDb(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) {
    const [, y, mo, d] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d)).toDateString();
  }
  return new Date(value).toDateString();
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function pushEvent(event: CalendarEvent, userId: string | undefined) {
  if (!userId) return;
  supabase
    .from("calendar_events")
    .upsert(
      {
        user_id: userId,
        id: event.id,
        title: event.title,
        day: toDbDate(event.day),
        start_time: event.start,
        end_time: event.end,
        color: event.color,
        repeat: event.repeat,
        repeat_days: event.repeatDays,
        repeat_interval: event.repeatInterval,
        repeat_until: event.repeatUntil,
        exceptions: event.exceptions.map(toDbDate),
        ai_generated: event.ai,
      },
      { onConflict: "user_id,id" },
    )
    .then(reportWrite("save event"));
}

function pushTodo(todo: Todo, userId: string | undefined) {
  if (!userId) return;
  supabase
    .from("todos")
    .upsert({
      id: todo.id,
      user_id: userId,
      text: todo.text,
      done: todo.done,
      priority: todo.priority,
      day: toDbDate(todo.day),
      due_date: todo.dueDate,
      due_time: todo.dueTime,
      repeat: todo.repeat,
      repeat_days: todo.repeatDays,
      repeat_interval: todo.repeatInterval,
      done_dates: todo.doneDates.map(toDbDate),
    })
    .then(reportWrite("save task"));
}

const EMPTY_WEEK = [false, false, false, false, false, false, false];

type PlannerContextValue = {
  /** True once the initial cloud pull for this sign-in has finished. */
  synced: boolean;
  plannerDay: Date;
  calendarMonth: Date;
  todos: Todo[];
  habits: Habit[];
  events: CalendarEvent[];
  moodHistory: MoodHistory;
  setPlannerDay: (d: Date) => void;
  changeDay: (delta: number) => void;
  goToday: () => void;
  setCalendarMonth: (d: Date) => void;
  /** Creates the event (no id) or replaces the one with the same id. */
  saveEvent: (event: Omit<CalendarEvent, "id"> & { id?: number }) => void;
  /**
   * Deletes an event. For a repeating event, passing `onlyDayKey` removes just
   * that occurrence and keeps the rest of the series.
   */
  deleteEvent: (id: number, onlyDayKey?: string) => void;
  addTodo: (text: string, priority: Priority, details?: Partial<TodoDetails>) => void;
  updateTodo: (id: number, text: string, priority: Priority, details?: Partial<TodoDetails>) => void;
  /** Toggles a one-off task, or a repeating task's completion on `dayKey`. */
  toggleTodo: (id: number, dayKey: string) => void;
  deleteTodo: (id: number) => void;
  addHabit: (name: string) => void;
  toggleHabitDay: (id: number, dayIndex: number) => void;
  deleteHabit: (id: number) => void;
  /** When on, habit ticks clear at the start of every week (Sunday). */
  habitsResetWeekly: boolean;
  /** First and last hour slots the schedule shows (0–23, inclusive). */
  scheduleHours: { start: number; end: number };
  setScheduleHours: (start: number, end: number) => Promise<{ error: string | null }>;
  /** Past weeks, newest first. Only recorded while weekly reset is on. */
  habitHistory: HabitWeek[];
  setHabitsResetWeekly: (on: boolean) => Promise<{ error: string | null }>;
  setMood: (value: number) => Promise<void>;
};

const PlannerContext = createContext<PlannerContextValue | undefined>(undefined);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plannerDay, setPlannerDay] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [todos, setTodos] = useState<Todo[]>(() => readJson<Todo[]>(TODOS_KEY, []).map(normalizeTodo));
  const [habits, setHabits] = useState<Habit[]>(() => readJson(HABITS_KEY, DEFAULT_HABITS));
  const [habitHistory, setHabitHistory] = useState<HabitWeek[]>(() => readJson(HABIT_HISTORY_KEY, []));
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem(EVENTS_KEY) === null) {
      return eventsFromLegacyMap(readJson(LEGACY_EVENTS_KEY, {}));
    }
    return readJson<CalendarEvent[]>(EVENTS_KEY, []).map(normalizeEvent);
  });
  const [moodHistory, setMoodHistory] = useState<MoodHistory>(() => readJson(MOOD_KEY, {}));
  const [synced, setSynced] = useState(false);

  // Stored on the account (not per browser) so every device agrees on which
  // week was last reset and a stale device can't wipe this week's ticks.
  const habitsResetWeekly = user?.user_metadata?.habits_reset_weekly === true;
  const habitsWeekStart: string | undefined = user?.user_metadata?.habits_week_start;
  const scheduleStart = Number(user?.user_metadata?.schedule_start_hour ?? DEFAULT_SCHEDULE_HOURS.start);
  const scheduleEnd = Number(user?.user_metadata?.schedule_end_hour ?? DEFAULT_SCHEDULE_HOURS.end);
  const habitsRef = useRef(habits);
  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  useEffect(() => {
    if (!user || !synced || !habitsResetWeekly) return;
    let done = false;

    function resetIfNewWeek() {
      const current = weekStartKey();
      if (done || !user || (habitsWeekStart && habitsWeekStart >= current)) return;
      done = true;

      // Keep the finished week before wiping it. The ticks belong to the week
      // of the last reset (which may be several weeks ago if the app sat idle).
      const snapshot: HabitWeek = {
        weekStart: habitsWeekStart ?? weekStartKey(new Date(Date.now() - 7 * 86_400_000)),
        habits: habitsRef.current.map((h) => ({ id: h.id, name: h.name, days: [...h.days] })),
      };
      if (snapshot.habits.length) {
        setHabitHistory((prev) =>
          [snapshot, ...prev.filter((w) => w.weekStart !== snapshot.weekStart)]
            .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
            .slice(0, HISTORY_WEEKS_KEPT),
        );
        supabase
          .from("habit_history")
          .upsert(
            { user_id: user.id, week_start: snapshot.weekStart, habits: snapshot.habits },
            { onConflict: "user_id,week_start" },
          )
          .then(reportWrite("save habit history"));
      }

      const cleared = habitsRef.current.map((h) => ({ ...h, days: [...EMPTY_WEEK] }));
      setHabits(cleared);
      if (cleared.length) {
        supabase
          .from("habits")
          .upsert(cleared.map((h) => ({ ...h, user_id: user.id })))
          .then(reportWrite("reset habits for the new week"));
      }
      supabase.auth
        .updateUser({ data: { habits_week_start: current } })
        .then(({ error }) => error && console.error("Failed to record habit reset:", error.message));
    }

    // Check now and every minute, so a week that rolls over while the app is
    // open still resets.
    const first = setTimeout(resetIfNewWeek, 0);
    const timer = setInterval(resetIfNewWeek, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [user, synced, habitsResetWeekly, habitsWeekStart]);

  useEffect(() => {
    window.localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  }, [todos]);
  useEffect(() => {
    window.localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }, [habits]);
  useEffect(() => {
    window.localStorage.setItem(HABIT_HISTORY_KEY, JSON.stringify(habitHistory));
  }, [habitHistory]);
  useEffect(() => {
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }, [events]);
  useEffect(() => {
    window.localStorage.setItem(MOOD_KEY, JSON.stringify(moodHistory));
  }, [moodHistory]);

  // Pull cloud data once per sign-in.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const todosPull = supabase
      .from("todos")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.length) return;
        setTodos(
          data.map((r) =>
            normalizeTodo({
              id: r.id,
              text: r.text,
              done: r.done,
              priority: r.priority,
              day: localDateKeyFromDb(r.day),
              dueDate: r.due_date ?? null,
              dueTime: r.due_time ?? null,
              repeat: r.repeat ?? "none",
              repeatDays: r.repeat_days ?? [],
              repeatInterval: r.repeat_interval ?? 1,
              doneDates: (r.done_dates ?? []).map(localDateKeyFromDb),
            }),
          ),
        );
      });

    const habitsPull = supabase
      .from("habits")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.length) return;
        setHabits(data.map((r) => ({ id: r.id, name: r.name, days: r.days })));
      });

    const eventsPull = supabase
      .from("calendar_events")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.length) return;
        setEvents(
          data.map((r) =>
            normalizeEvent({
              id: Number(r.id),
              title: r.title,
              day: localDateKeyFromDb(r.day),
              start: r.start_time,
              end: r.end_time,
              color: r.color,
              repeat: r.repeat,
              repeatDays: r.repeat_days ?? [],
              repeatInterval: r.repeat_interval ?? 1,
              repeatUntil: r.repeat_until ?? null,
              exceptions: (r.exceptions ?? []).map(localDateKeyFromDb),
              ai: r.ai_generated ?? false,
            }),
          ),
        );
      });

    const moodPull = supabase
      .from("mood_history")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.length) return;
        const map: MoodHistory = {};
        for (const row of data) {
          map[localDateKeyFromDb(row.date)] = row.mood_value;
        }
        setMoodHistory(map);
      });

    const historyPull = supabase
      .from("habit_history")
      .select("week_start, habits")
      .order("week_start", { ascending: false })
      .limit(HISTORY_WEEKS_KEPT)
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.length) return;
        setHabitHistory(data.map((r) => ({ weekStart: r.week_start, habits: r.habits ?? [] })));
      });

    const markSynced = () => !cancelled && setSynced(true);
    Promise.all([todosPull, habitsPull, eventsPull, moodPull, historyPull]).then(markSynced, markSynced);

    return () => {
      cancelled = true;
    };
  }, [user]);

  const value = useMemo<PlannerContextValue>(
    () => ({
      synced,
      plannerDay,
      calendarMonth,
      todos,
      habits,
      events,
      moodHistory,
      setPlannerDay,
      changeDay(delta) {
        setPlannerDay((prev) => {
          const next = new Date(prev);
          next.setDate(next.getDate() + delta);
          setCalendarMonth(new Date(next));
          return next;
        });
      },
      goToday() {
        const now = new Date();
        setPlannerDay(now);
        setCalendarMonth(new Date());
      },
      setCalendarMonth,

      saveEvent(fields) {
        const event = normalizeEvent({ ...fields, id: fields.id ?? Date.now() });
        setEvents((prev) => [...prev.filter((e) => e.id !== event.id), event]);
        pushEvent(event, user?.id);
      },

      deleteEvent(id, onlyDayKey) {
        const event = events.find((e) => e.id === id);
        if (!event) return;
        if (onlyDayKey && event.repeat !== "none") {
          const next = { ...event, exceptions: [...event.exceptions, onlyDayKey] };
          setEvents((prev) => prev.map((e) => (e.id === id ? next : e)));
          pushEvent(next, user?.id);
          return;
        }
        setEvents((prev) => prev.filter((e) => e.id !== id));
        if (user) {
          supabase
            .from("calendar_events")
            .delete()
            .eq("user_id", user.id)
            .eq("id", id)
            .then(reportWrite("delete event"));
        }
      },

      addTodo(text, priority, details) {
        const clean = text.trim();
        if (!clean) return;
        const todo = normalizeTodo({
          id: Date.now(),
          text: clean,
          priority,
          day: plannerDay.toDateString(),
          ...details,
        });
        setTodos((prev) => [...prev, todo]);
        pushTodo(todo, user?.id);
      },

      updateTodo(id, text, priority, details) {
        const clean = text.trim();
        const todo = todos.find((t) => t.id === id);
        if (!clean || !todo) return;
        const next = { ...todo, ...details, text: clean, priority };
        setTodos((prev) => prev.map((t) => (t.id === id ? next : t)));
        pushTodo(next, user?.id);
      },

      toggleTodo(id, dayKey) {
        const todo = todos.find((t) => t.id === id);
        if (!todo) return;
        const next =
          todo.repeat === "none"
            ? { ...todo, done: !todo.done }
            : {
                ...todo,
                doneDates: todo.doneDates.includes(dayKey)
                  ? todo.doneDates.filter((d) => d !== dayKey)
                  : [...todo.doneDates, dayKey],
              };
        setTodos((prev) => prev.map((t) => (t.id === id ? next : t)));
        pushTodo(next, user?.id);
      },

      deleteTodo(id) {
        setTodos((prev) => prev.filter((t) => t.id !== id));
        if (user) {
          supabase
            .from("todos")
            .delete()
            .eq("id", id)
            .then(reportWrite("delete task"));
        }
      },

      addHabit(name) {
        const clean = name.trim();
        if (!clean) return;
        const habit: Habit = { id: Date.now(), name: clean, days: [false, false, false, false, false, false, false] };
        setHabits((prev) => [...prev, habit]);
        if (user) {
          supabase.from("habits").upsert({ ...habit, user_id: user.id }).then(reportWrite("save habit"));
        }
      },

      toggleHabitDay(id, dayIndex) {
        const habit = habits.find((h) => h.id === id);
        if (!habit) return;
        const days = habit.days.map((d, i) => (i === dayIndex ? !d : d));
        setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, days } : h)));
        if (user) {
          supabase
            .from("habits")
            .upsert({ ...habit, days, user_id: user.id })
            .then(reportWrite("update habit"));
        }
      },

      deleteHabit(id) {
        setHabits((prev) => prev.filter((h) => h.id !== id));
        if (user) {
          supabase.from("habits").delete().eq("id", id).then(reportWrite("delete habit"));
        }
      },

      habitsResetWeekly,
      habitHistory,
      scheduleHours: { start: scheduleStart, end: scheduleEnd },

      async setScheduleHours(start, end) {
        const { error } = await supabase.auth.updateUser({
          data: { schedule_start_hour: start, schedule_end_hour: end },
        });
        return { error: error?.message ?? null };
      },

      async setHabitsResetWeekly(on) {
        // Starting from this week means switching on never wipes current ticks.
        const { error } = await supabase.auth.updateUser({
          data: { habits_reset_weekly: on, habits_week_start: weekStartKey() },
        });
        return { error: error?.message ?? null };
      },

      async setMood(val) {
        const todayDate = new Date();
        const todayKey = todayDate.toDateString();
        // Local calendar date; toISOString() would give the UTC date instead.
        const todayISO = toDbDate(todayKey);

        setMoodHistory((prev) => {
          const next = { ...prev, [todayKey]: val };
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 7);
          for (const key of Object.keys(next)) {
            if (new Date(key) < cutoff) delete next[key];
          }
          return next;
        });

        if (user) {
          reportWrite("save mood")(
            await supabase
              .from("mood_history")
              .upsert({ user_id: user.id, date: todayISO, mood_value: val }, { onConflict: "user_id, date" }),
          );
        }
      },
    }),
    [synced, plannerDay, calendarMonth, todos, habits, events, moodHistory, user, habitsResetWeekly, habitHistory, scheduleStart, scheduleEnd],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used within a PlannerProvider");
  return ctx;
}
