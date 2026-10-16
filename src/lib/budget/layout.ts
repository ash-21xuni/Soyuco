// Order of the Budget Planner's cards across its two columns.

import { normalizeBoardLayout, type BoardLayout } from "@/lib/board/layout";

export const BUDGET_CARDS = ["transactions", "recurring", "categories", "goals", "limits"] as const;
export type BudgetCardId = (typeof BUDGET_CARDS)[number];
export type BudgetLayout = BoardLayout<BudgetCardId>;

export const DEFAULT_BUDGET_LAYOUT: BudgetLayout = {
  left: ["transactions", "recurring"],
  right: ["categories", "goals", "limits"],
};

export function normalizeBudgetLayout(raw: unknown): BudgetLayout {
  return normalizeBoardLayout(raw, BUDGET_CARDS, DEFAULT_BUDGET_LAYOUT);
}
