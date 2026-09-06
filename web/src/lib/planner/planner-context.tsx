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

export type Priority = "high" | "med" | "low";
export type Todo = { id: number; text: string; done: boolean; priority: Priority; day: string };
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

type PlannerContextValue = {
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
  addTodo: (text: string, priority: Priority) => void;
  updateTodo: (id: number, text: string, priority: Priority) => void;
  toggleTodo: (id: number) => void;
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
  const [todos, setTodos] = useState<Todo[]>(() => readJson(TODOS_KEY, []));
  const [habits, setHabits] = useState<Habit[]>(() => readJson(HABITS_KEY, DEFAULT_HABITS));
  const [events, setEvents] = useState<EventsMap>(() => readJson(EVENTS_KEY, {}));
  const [moodHistory, setMoodHistory] = useState<MoodHistory>(() => readJson(MOOD_KEY, {}));

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

    supabase
      .from("todos")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.length) return;
        setTodos(
          data.map((r) => ({
            id: r.id,
            text: r.text,
            done: r.done,
            priority: r.priority,
            day: localDateKeyFromDb(r.day),
          })),
        );
      });

    supabase
      .from("habits")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.length) return;
        setHabits(data.map((r) => ({ id: r.id, name: r.name, days: r.days })));
      });

    supabase
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

    supabase
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

    return () => {
      cancelled = true;
    };
  }, [user]);

  const value = useMemo<PlannerContextValue>(
    () => ({
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
        supabase
          .from("events")
          .delete()
          .eq("user_id", user.id)
          .eq("day", dayKey)
          .eq("hour", hour)
          .then(async () => {
            if (clean) {
              await supabase
                .from("events")
                .insert({ user_id: user.id, day: dayKey, hour, text: clean, ai_generated: aiFlag });
            }
          });
      },

      addTodo(text, priority) {
        const clean = text.trim();
        if (!clean) return;
        const todo: Todo = { id: Date.now(), text: clean, done: false, priority, day: plannerDay.toDateString() };
        setTodos((prev) => [...prev, todo]);
        if (user) {
          supabase.from("todos").upsert({ ...todo, user_id: user.id });
        }
      },

      updateTodo(id, text, priority) {
        const clean = text.trim();
        if (!clean) return;
        setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: clean, priority } : t)));
        const todo = todos.find((t) => t.id === id);
        if (user && todo) {
          supabase.from("todos").upsert({ ...todo, text: clean, priority, user_id: user.id });
        }
      },

      toggleTodo(id) {
        const todo = todos.find((t) => t.id === id);
        if (!todo) return;
        const done = !todo.done;
        setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
        if (user) {
          supabase.from("todos").upsert({ ...todo, done, user_id: user.id });
        }
      },

      deleteTodo(id) {
        setTodos((prev) => prev.filter((t) => t.id !== id));
        if (user) {
          supabase.from("todos").delete().eq("id", id);
        }
      },

      addHabit(name) {
        const clean = name.trim();
        if (!clean) return;
        const habit: Habit = { id: Date.now(), name: clean, days: [false, false, false, false, false, false, false] };
        setHabits((prev) => [...prev, habit]);
        if (user) {
          supabase.from("habits").upsert({ ...habit, user_id: user.id });
        }
      },

      toggleHabitDay(id, dayIndex) {
        const habit = habits.find((h) => h.id === id);
        if (!habit) return;
        const days = habit.days.map((d, i) => (i === dayIndex ? !d : d));
        setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, days } : h)));
        if (user) {
          supabase.from("habits").upsert({ ...habit, days, user_id: user.id });
        }
      },

      deleteHabit(id) {
        setHabits((prev) => prev.filter((h) => h.id !== id));
        if (user) {
          supabase.from("habits").delete().eq("id", id);
        }
      },

      async setMood(val) {
        const todayDate = new Date();
        const todayKey = todayDate.toDateString();
        const todayISO = todayDate.toISOString().split("T")[0];

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
          await supabase
            .from("mood_history")
            .upsert({ user_id: user.id, date: todayISO, mood_value: val }, { onConflict: "user_id, date" });
        }
      },
    }),
    [plannerDay, calendarMonth, todos, habits, events, moodHistory, user],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used within a PlannerProvider");
  return ctx;
}
