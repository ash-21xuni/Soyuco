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
import { reportWrite } from "@/lib/supabase/write";
import { useToast } from "@/lib/toast/toast-context";
import { normalizeBudgetLayout, type BudgetLayout } from "@/lib/budget/layout";
import {
  addDays,
  monthKey,
  monthLabel,
  monthsAfter,
  occurrencesBetween,
  shiftMonth,
  todayStr,
  type Frequency,
} from "@/lib/budget/recurring";
import type { SettingsIconName } from "@/components/settings/SettingsIcon";
import { useCurrency } from "@/lib/budget/currency";

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
  // Set when the transaction was posted automatically by a recurring item.
  recurringId?: number | null;
  occurrence?: string | null;
};
export type TxFields = { desc: string; amount: number; type: TxType; cat: Category; date: string };

// `monthly` is put towards the goal automatically at the start of each month;
// `lastContribution` is the last month ("YYYY-MM") that happened.
export type Goal = {
  id: number;
  name: string;
  target: number;
  saved: number;
  monthly: number;
  lastContribution: string | null;
};
export type Limit = { cat: Category; amount: number };

export type RecurringFields = {
  desc: string;
  amount: number;
  type: TxType;
  cat: Category;
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
};
// `lastPosted` is the most recent date a transaction was created for.
export type RecurringRule = RecurringFields & { id: number; lastPosted: string | null; active: boolean };

export const CAT_LABELS: Record<Category, string> = {
  food: "Food",
  transport: "Transport",
  housing: "Housing",
  health: "Health",
  entertainment: "Entertainment",
  shopping: "Shopping",
  utilities: "Utilities",
  salary: "Salary",
  other: "Other",
};

export const CAT_ICONS: Record<Category, SettingsIconName> = {
  food: "utensils",
  transport: "car",
  housing: "home",
  health: "pill",
  entertainment: "film",
  shopping: "shoppingBag",
  utilities: "lightbulb",
  salary: "briefcase",
  other: "tag",
};

const TX_KEY = "soyuco_tx";
const GOALS_KEY = "soyuco_goals";
const LIMITS_KEY = "soyuco_limits";
const RECURRING_KEY = "soyuco_recurring";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// Goals cached before auto-saving existed have no monthly amount.
function readGoals(): Goal[] {
  return readJson<Partial<Goal>[]>(GOALS_KEY, []).map((g) => ({
    id: g.id ?? Date.now(),
    name: g.name ?? "",
    target: g.target ?? 0,
    saved: g.saved ?? 0,
    monthly: g.monthly ?? 0,
    lastContribution: g.lastContribution ?? null,
  }));
}

/**
 * Creates the transactions recurring items are due for up to `today` (skipping
 * any already recorded) and moves each item's `lastPosted` forward.
 */
function postRecurring(rules: RecurringRule[], transactions: Transaction[], today: string) {
  const recorded = new Set(
    transactions.filter((t) => t.recurringId != null).map((t) => `${t.recurringId}|${t.occurrence}`),
  );
  let nextId = Date.now();
  const posted: Transaction[] = [];
  const changed: RecurringRule[] = [];

  const next = rules.map((rule) => {
    if (!rule.active) return rule;
    const from = rule.lastPosted ? addDays(rule.lastPosted, 1) : rule.startDate;
    const dates = occurrencesBetween(rule, from, today);
    if (!dates.length) return rule;
    for (const date of dates) {
      if (recorded.has(`${rule.id}|${date}`)) continue;
      posted.push({
        id: nextId++,
        desc: rule.desc,
        amount: rule.amount,
        type: rule.type,
        cat: rule.cat,
        date,
        recurringId: rule.id,
        occurrence: date,
      });
    }
    const updated = { ...rule, lastPosted: dates[dates.length - 1] };
    changed.push(updated);
    return updated;
  });

  return { rules: next, posted, changed };
}

/** Adds each goal's monthly auto-save for every month since it last ran. */
function applyAutoSavings(goals: Goal[], month: string) {
  const changed: Goal[] = [];
  const next = goals.map((g) => {
    if (g.monthly <= 0 || !g.lastContribution || g.lastContribution >= month) return g;
    const months = monthsAfter(g.lastContribution, month).length;
    const saved = g.saved >= g.target ? g.saved : Math.min(g.target, g.saved + g.monthly * months);
    const updated = { ...g, saved, lastContribution: month };
    changed.push(updated);
    return updated;
  });
  return { goals: next, changed };
}

function txRow(t: Transaction, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    description: t.desc,
    amount: t.amount,
    type: t.type,
    category: t.cat,
    date: t.date,
  };
}

function ruleRow(r: RecurringRule, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    description: r.desc,
    amount: r.amount,
    type: r.type,
    category: r.cat,
    frequency: r.frequency,
    start_date: r.startDate,
    end_date: r.endDate,
    last_posted: r.lastPosted,
    active: r.active,
  };
}

function savePostedTransactions(posted: Transaction[], userId: string) {
  if (!posted.length) return;
  supabase
    .from("transactions")
    .upsert(
      posted.map((t) => ({ ...txRow(t, userId), recurring_id: t.recurringId, occurrence: t.occurrence })),
      // Another device may have posted the same occurrence already.
      { onConflict: "user_id,recurring_id,occurrence", ignoreDuplicates: true },
    )
    .then(reportWrite("post recurring transactions"));
}

function saveRules(rules: RecurringRule[], userId: string) {
  if (!rules.length) return;
  supabase
    .from("recurring_transactions")
    .upsert(rules.map((r) => ruleRow(r, userId)))
    .then(reportWrite("save recurring item"));
}

function saveGoal(goal: Goal, userId: string) {
  const { id, name, target, saved } = goal;
  supabase
    .from("goals")
    .upsert({ id, user_id: userId, name, target, saved })
    .then(({ error }) => {
      if (error) return reportWrite("save goal")({ error });
      // Kept apart so plain goal saves still work before the auto-save
      // columns are added (supabase/sql/budget_automation.sql).
      if (goal.monthly > 0 || goal.lastContribution) {
        supabase
          .from("goals")
          .update({ monthly_contribution: goal.monthly, last_contribution: goal.lastContribution })
          .eq("id", id)
          .then(reportWrite("save goal auto-save"));
      }
    });
}

type BudgetContextValue = {
  transactions: Transaction[];
  goals: Goal[];
  limits: Limit[];
  recurring: RecurringRule[];
  /** The month ("YYYY-MM") the budget page is showing. */
  viewMonth: string;
  setViewMonth: (month: string) => void;
  saveTransaction: (id: number | null, fields: TxFields) => void;
  deleteTransaction: (id: number) => void;
  addGoal: (fields: { name: string; target: number; saved: number; monthly: number }) => void;
  updateGoal: (id: number, fields: { name: string; target: number; monthly: number }) => void;
  applySavings: (goalId: number, amount: number, isAdd: boolean) => void;
  deleteGoal: (id: number) => void;
  saveLimit: (cat: Category, amount: number) => void;
  deleteLimit: (cat: Category) => void;
  saveRecurring: (id: number | null, fields: RecurringFields) => void;
  setRecurringActive: (id: number, active: boolean) => void;
  deleteRecurring: (id: number) => void;
  budgetLayout: BudgetLayout;
  setBudgetLayout: (layout: BudgetLayout) => Promise<{ error: string | null }>;
};

const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { money } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>(() => readJson(TX_KEY, []));
  const [goals, setGoals] = useState<Goal[]>(readGoals);
  const [limits, setLimits] = useState<Limit[]>(() => readJson(LIMITS_KEY, []));
  const [recurring, setRecurring] = useState<RecurringRule[]>(() => readJson(RECURRING_KEY, []));
  const [viewMonth, setViewMonth] = useState(() => monthKey(todayStr()));
  const savedLayout = user?.user_metadata?.budget_layout;
  const budgetLayout = useMemo(() => normalizeBudgetLayout(savedLayout), [savedLayout]);

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
    window.localStorage.setItem(RECURRING_KEY, JSON.stringify(recurring));
  }, [recurring]);

  // Load from the account, then catch up on anything that came due while the
  // app was closed: recurring transactions and monthly goal auto-saves.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const [txRes, goalRes, limitRes, ruleRes] = await Promise.all([
        supabase.from("transactions").select("*"),
        supabase.from("goals").select("*"),
        supabase.from("budget_limits").select("*"),
        supabase.from("recurring_transactions").select("*"),
      ]);
      if (cancelled) return;

      // An empty or failed load keeps what this device already has.
      const loadedTx: Transaction[] =
        !txRes.error && txRes.data?.length
          ? txRes.data.map((r) => ({
              id: r.id,
              desc: r.description,
              amount: Number(r.amount),
              type: r.type,
              cat: r.category,
              date: r.date,
              recurringId: r.recurring_id ?? null,
              occurrence: r.occurrence ?? null,
            }))
          : readJson(TX_KEY, []);
      const loadedGoals: Goal[] =
        !goalRes.error && goalRes.data?.length
          ? goalRes.data.map((r) => ({
              id: r.id,
              name: r.name,
              target: Number(r.target),
              saved: Number(r.saved),
              monthly: Number(r.monthly_contribution ?? 0),
              lastContribution: r.last_contribution ?? null,
            }))
          : readGoals();
      const loadedRules: RecurringRule[] =
        !ruleRes.error && ruleRes.data?.length
          ? ruleRes.data.map((r) => ({
              id: r.id,
              desc: r.description,
              amount: Number(r.amount),
              type: r.type,
              cat: r.category,
              frequency: r.frequency,
              startDate: r.start_date,
              endDate: r.end_date,
              lastPosted: r.last_posted,
              active: r.active,
            }))
          : readJson(RECURRING_KEY, []);

      const today = todayStr();
      const post = postRecurring(loadedRules, loadedTx, today);
      const saving = applyAutoSavings(loadedGoals, monthKey(today));

      setTransactions([...loadedTx, ...post.posted]);
      setRecurring(post.rules);
      setGoals(saving.goals);
      if (!limitRes.error && limitRes.data?.length) {
        setLimits(limitRes.data.map((r) => ({ cat: r.category, amount: Number(r.amount) })));
      }

      savePostedTransactions(post.posted, user.id);
      saveRules(post.changed, user.id);
      saving.changed.forEach((g) => saveGoal(g, user.id));
      if (post.posted.length) {
        const n = post.posted.length;
        showToast(`Added ${n} recurring transaction${n === 1 ? "" : "s"}`, "info");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, showToast]);

  const value = useMemo<BudgetContextValue>(() => {
    // Warns once when an expense takes a category past 80% or 100% of its limit.
    function checkLimit(id: number | null, fields: TxFields) {
      if (fields.type !== "expense") return;
      const limit = limits.find((l) => l.cat === fields.cat);
      if (!limit) return;
      const month = monthKey(fields.date);
      const before = transactions
        .filter((t) => t.id !== id && t.type === "expense" && t.cat === fields.cat && monthKey(t.date) === month)
        .reduce((s, t) => s + t.amount, 0);
      const after = before + fields.amount;
      const label = `${CAT_LABELS[fields.cat]} (${monthLabel(month)})`;
      if (before < limit.amount && after >= limit.amount) {
        showToast(`Over your ${label} limit: ${money(after, true)} of ${money(limit.amount, true)}`, "error");
      } else if (before < limit.amount * 0.8 && after >= limit.amount * 0.8) {
        showToast(`${Math.round((after / limit.amount) * 100)}% of your ${label} limit used`, "info");
      }
    }

    return {
      transactions,
      goals,
      limits,
      recurring,
      viewMonth,
      setViewMonth,

      saveTransaction(id, fields) {
        checkLimit(id, fields);
        const txId = id ?? Date.now();
        setTransactions((prev) => {
          if (id !== null && prev.some((t) => t.id === id)) {
            return prev.map((t) => (t.id === id ? { ...t, ...fields } : t));
          }
          return [...prev, { id: txId, ...fields }];
        });
        if (user) {
          supabase.from("transactions").upsert(txRow({ id: txId, ...fields }, user.id)).then(reportWrite("save transaction"));
        }
      },

      deleteTransaction(id) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        if (user) {
          supabase.from("transactions").delete().eq("id", id).then(reportWrite("delete transaction"));
        }
      },

      addGoal({ monthly, ...fields }) {
        const month = monthKey(todayStr());
        // Starting from last month makes this month's auto-save happen now.
        const goal: Goal = { id: Date.now(), ...fields, monthly, lastContribution: monthly > 0 ? shiftMonth(month, -1) : null };
        const [added] = applyAutoSavings([goal], month).goals;
        setGoals((prev) => [...prev, added]);
        if (user) saveGoal(added, user.id);
      },

      updateGoal(id, fields) {
        const goal = goals.find((g) => g.id === id);
        if (!goal) return;
        const month = monthKey(todayStr());
        const startsNow = fields.monthly > 0 && goal.monthly <= 0;
        const edited: Goal = {
          ...goal,
          ...fields,
          lastContribution: startsNow ? shiftMonth(month, -1) : goal.lastContribution,
        };
        const [updated] = applyAutoSavings([edited], month).goals;
        setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
        if (user) saveGoal(updated, user.id);
      },

      applySavings(goalId, amount, isAdd) {
        const goal = goals.find((g) => g.id === goalId);
        if (!goal) return;
        const saved = Math.max(0, goal.saved + (isAdd ? amount : -amount));
        setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, saved } : g)));
        if (user) saveGoal({ ...goal, saved }, user.id);
      },

      deleteGoal(id) {
        setGoals((prev) => prev.filter((g) => g.id !== id));
        if (user) {
          supabase.from("goals").delete().eq("id", id).then(reportWrite("delete goal"));
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
            .then(({ error }) => {
              if (error) return reportWrite("clear budget limit")({ error });
              supabase
                .from("budget_limits")
                .insert({ user_id: user.id, category: cat, amount })
                .then(reportWrite("save budget limit"));
            });
        }
      },

      deleteLimit(cat) {
        setLimits((prev) => prev.filter((l) => l.cat !== cat));
        if (user) {
          supabase
            .from("budget_limits")
            .delete()
            .eq("user_id", user.id)
            .eq("category", cat)
            .then(reportWrite("delete budget limit"));
        }
      },

      // Saving posts anything already due, so a salary that started on the
      // 1st shows up straight away. Edits only change future transactions.
      saveRecurring(id, fields) {
        const existing = recurring.find((r) => r.id === id);
        const rule: RecurringRule = existing
          ? { ...existing, ...fields }
          : { id: Date.now(), ...fields, lastPosted: null, active: true };
        const post = postRecurring([rule], transactions, todayStr());
        const saved = post.rules[0];
        setRecurring((prev) => (existing ? prev.map((r) => (r.id === id ? saved : r)) : [...prev, saved]));
        setTransactions((prev) => [...prev, ...post.posted]);
        if (user) {
          saveRules([saved], user.id);
          savePostedTransactions(post.posted, user.id);
        }
        if (post.posted.length) {
          const n = post.posted.length;
          showToast(`Added ${n} transaction${n === 1 ? "" : "s"} already due`, "info");
        }
      },

      // Resuming skips whatever came due while paused rather than back-filling.
      setRecurringActive(id, active) {
        const rule = recurring.find((r) => r.id === id);
        if (!rule) return;
        const updated = { ...rule, active, lastPosted: active ? todayStr() : rule.lastPosted };
        setRecurring((prev) => prev.map((r) => (r.id === id ? updated : r)));
        if (user) saveRules([updated], user.id);
      },

      // Transactions it already created stay in the history.
      deleteRecurring(id) {
        setRecurring((prev) => prev.filter((r) => r.id !== id));
        if (user) {
          supabase.from("recurring_transactions").delete().eq("id", id).then(reportWrite("delete recurring item"));
        }
      },

      budgetLayout,

      async setBudgetLayout(layout) {
        const { error } = await supabase.auth.updateUser({ data: { budget_layout: layout } });
        return { error: error?.message ?? null };
      },
    };
  }, [transactions, goals, limits, recurring, viewMonth, user, budgetLayout, showToast, money]);

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within a BudgetProvider");
  return ctx;
}

/** Transactions dated in the given "YYYY-MM" month. */
export function inMonth(transactions: Transaction[], month: string) {
  return transactions.filter((t) => monthKey(t.date) === month);
}
