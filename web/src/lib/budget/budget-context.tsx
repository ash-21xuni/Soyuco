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

export type TxType = "expense" | "income";
export type Category =
  | "food"
  | "transport"
  | "housing"
  | "health"
  | "entertainment"
  | "shopping"
  | "utilities"
  | "salary"
  | "other";

export type Transaction = {
  id: number;
  desc: string;
  amount: number;
  type: TxType;
  cat: Category;
  date: string;
};
export type Goal = { id: number; name: string; target: number; saved: number };
export type Limit = { cat: Category; amount: number };

export const CAT_LABELS: Record<Category, string> = {
  food: "🍔 Food",
  transport: "🚗 Transport",
  housing: "🏠 Housing",
  health: "💊 Health",
  entertainment: "🎬 Entertainment",
  shopping: "🛍 Shopping",
  utilities: "💡 Utilities",
  salary: "💼 Salary",
  other: "◇ Other",
};

const TX_KEY = "soyuco_tx";
const GOALS_KEY = "soyuco_goals";
const LIMITS_KEY = "soyuco_limits";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

type BudgetContextValue = {
  transactions: Transaction[];
  goals: Goal[];
  limits: Limit[];
  saveTransaction: (
    id: number | null,
    fields: { desc: string; amount: number; type: TxType; cat: Category; date: string },
  ) => void;
  deleteTransaction: (id: number) => void;
  addGoal: (fields: { name: string; target: number; saved: number }) => void;
  applySavings: (goalId: number, amount: number, isAdd: boolean) => void;
  deleteGoal: (id: number) => void;
  saveLimit: (cat: Category, amount: number) => void;
  deleteLimit: (cat: Category) => void;
};

const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(() => readJson(TX_KEY, []));
  const [goals, setGoals] = useState<Goal[]>(() => readJson(GOALS_KEY, []));
  const [limits, setLimits] = useState<Limit[]>(() => readJson(LIMITS_KEY, []));

  useEffect(() => {
    window.localStorage.setItem(TX_KEY, JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
    window.localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }, [goals]);
  useEffect(() => {
    window.localStorage.setItem(LIMITS_KEY, JSON.stringify(limits));
  }, [limits]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase
      .from("transactions")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.length) return;
        setTransactions(
          data.map((r) => ({ id: r.id, desc: r.description, amount: r.amount, type: r.type, cat: r.category, date: r.date })),
        );
      });

    supabase
      .from("goals")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.length) return;
        setGoals(data.map((r) => ({ id: r.id, name: r.name, target: r.target, saved: r.saved })));
      });

    supabase
      .from("budget_limits")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.length) return;
        setLimits(data.map((r) => ({ cat: r.category, amount: r.amount })));
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const value = useMemo<BudgetContextValue>(
    () => ({
      transactions,
      goals,
      limits,

      saveTransaction(id, fields) {
        const txId = id ?? Date.now();
        setTransactions((prev) => {
          if (id !== null && prev.some((t) => t.id === id)) {
            return prev.map((t) => (t.id === id ? { ...t, ...fields } : t));
          }
          return [...prev, { id: txId, ...fields }];
        });
        if (user) {
          supabase.from("transactions").upsert({
            id: txId,
            user_id: user.id,
            description: fields.desc,
            amount: fields.amount,
            type: fields.type,
            category: fields.cat,
            date: fields.date,
          });
        }
      },

      deleteTransaction(id) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        if (user) {
          supabase.from("transactions").delete().eq("id", id);
        }
      },

      addGoal(fields) {
        const id = Date.now();
        setGoals((prev) => [...prev, { id, ...fields }]);
        if (user) {
          supabase.from("goals").upsert({ id, user_id: user.id, ...fields });
        }
      },

      applySavings(goalId, amount, isAdd) {
        const goal = goals.find((g) => g.id === goalId);
        if (!goal) return;
        const saved = Math.max(0, goal.saved + (isAdd ? amount : -amount));
        setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, saved } : g)));
        if (user) {
          supabase.from("goals").upsert({ id: goal.id, user_id: user.id, name: goal.name, target: goal.target, saved });
        }
      },

      deleteGoal(id) {
        setGoals((prev) => prev.filter((g) => g.id !== id));
        if (user) {
          supabase.from("goals").delete().eq("id", id);
        }
      },

      saveLimit(cat, amount) {
        setLimits((prev) => [...prev.filter((l) => l.cat !== cat), { cat, amount }]);
        if (user) {
          supabase
            .from("budget_limits")
            .delete()
            .eq("user_id", user.id)
            .eq("category", cat)
            .then(async () => {
              await supabase.from("budget_limits").insert({ user_id: user.id, category: cat, amount });
            });
        }
      },

      deleteLimit(cat) {
        setLimits((prev) => prev.filter((l) => l.cat !== cat));
        if (user) {
          supabase.from("budget_limits").delete().eq("user_id", user.id).eq("category", cat);
        }
      },
    }),
    [transactions, goals, limits, user],
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within a BudgetProvider");
  return ctx;
}
