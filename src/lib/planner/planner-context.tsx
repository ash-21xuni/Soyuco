"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { normalizeTodo, toDbDate, type Repeat } from "@/lib/planner/tasks";
import { reportWrite } from "@/lib/supabase/write";

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
  /** Day keys on which a repeating task was completed. */
  doneDates: string[];
};
export type TodoDetails = Pick<Todo, "dueDate" | "dueTime" | "repeat">;
export type Habit = { id: number; name: string; days: boolean[] };
export type EventEntry = { text: string; ai: boolean };
export type EventsMap = Record<string, Record<number, EventEntry>>;
export type MoodHistory = Record<string, number>;

const TODOS_KEY = "soyuco_todos";
const HABITS_KEY = "soyuco_habits";
const EVENTS_KEY = "soyuco_events";
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
      done_dates: todo.doneDates.map(toDbDate),
    })
    .then(reportWrite("save task"));
}

type PlannerContextValue = {
  /** True once the initial cloud pull for this sign-in has finished. */
  synced: boolean;
  plannerDay: Date;
  calendarMonth: Date;
  todos: Todo[];
  habits: Habit[];
  events: EventsMap;
  moodHistory: MoodHistory;
  setPlannerDay: (d: Date) => void;
  changeDay: (delta: number) => void;
  goToday: () => void;
  setCalendarMonth: (d: Date) => void;
  saveEvent: (dayKey: string, hour: number, text: string, ai?: boolean) => void;
  addTodo: (text: string, priority: Priority, details?: Partial<TodoDetails>) => void;
  updateTodo: (id: number, text: string, priority: Priority, details?: Partial<TodoDetails>) => void;
  /** Toggles a one-off task, or a repeating task's completion on `dayKey`. */
  toggleTodo: (id: number, dayKey: string) => void;
  deleteTodo: (id: number) => void;
  addHabit: (name: string) => void;
  toggleHabitDay: (id: number, dayIndex: number) => void;
  deleteHabit: (id: number) => void;
  setMood: (value: number) => Promise<void>;
};

const PlannerContext = createContext<PlannerContextValue | undefined>(undefined);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plannerDay, setPlannerDay] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [todos, setTodos] = useState<Todo[]>(() => readJson<Todo[]>(TODOS_KEY, []).map(normalizeTodo));
  const [habits, setHabits] = useState<Habit[]>(() => readJson(HABITS_KEY, DEFAULT_HABITS));
  const [events, setEvents] = useState<EventsMap>(() => readJson(EVENTS_KEY, {}));
  const [moodHistory, setMoodHistory] = useState<MoodHistory>(() => readJson(MOOD_KEY, {}));
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  }, [todos]);
  useEffect(() => {
    window.localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }, [habits]);
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
      .from("events")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.length) return;
        const map: EventsMap = {};
        for (const row of data) {
          const dayKey = localDateKeyFromDb(row.day);
          if (!map[dayKey]) map[dayKey] = {};
          map[dayKey][row.hour] = { text: row.text, ai: row.ai_generated ?? false };
        }
        setEvents(map);
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

    const markSynced = () => !cancelled && setSynced(true);
    Promise.all([todosPull, habitsPull, eventsPull, moodPull]).then(markSynced, markSynced);

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

      saveEvent(dayKey, hour, text, ai) {
        const clean = text.trim();
        let aiFlag = ai ?? false;
        setEvents((prev) => {
          const next: EventsMap = { ...prev, [dayKey]: { ...(prev[dayKey] ?? {}) } };
          if (!clean) {
            delete next[dayKey][hour];
          } else {
            const existing = next[dayKey][hour];
            aiFlag = ai ?? existing?.ai ?? false;
            next[dayKey][hour] = { text: clean, ai: aiFlag };
          }
          return next;
        });

        if (!user) return;
        const day = toDbDate(dayKey);
        supabase
          .from("events")
          .delete()
          .eq("user_id", user.id)
          .eq("day", day)
          .eq("hour", hour)
          .then(({ error }) => {
            if (error) return reportWrite("clear event")({ error });
            if (clean) {
              supabase
                .from("events")
                .insert({ user_id: user.id, day, hour, text: clean, ai_generated: aiFlag })
                .then(reportWrite("save event"));
            }
          });
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
    [synced, plannerDay, calendarMonth, todos, habits, events, moodHistory, user],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used within a PlannerProvider");
  return ctx;
}
