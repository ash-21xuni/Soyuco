"use client";

import { useBudget } from "@/lib/budget/budget-context";
import { DEFAULT_BUDGET_LAYOUT, type BudgetCardId } from "@/lib/budget/layout";
import { CardBoard, type BoardCards } from "@/components/board/CardBoard";
import { TransactionList } from "@/components/budget/TransactionList";
import { RecurringList } from "@/components/budget/RecurringList";
import { CategoryBreakdown } from "@/components/budget/CategoryBreakdown";
import { SavingsGoals } from "@/components/budget/SavingsGoals";
import { BudgetLimits } from "@/components/budget/BudgetLimits";

const CARDS: BoardCards<BudgetCardId> = {
  transactions: { label: "Transactions", render: () => <TransactionList /> },
  recurring: { label: "Recurring", render: () => <RecurringList /> },
  categories: { label: "Spending by category", render: () => <CategoryBreakdown /> },
  goals: { label: "Savings goals", render: () => <SavingsGoals /> },
  limits: { label: "Budget limits", render: () => <BudgetLimits /> },
};

// Budget Planner cards in two draggable columns, saved to the account.
export function BudgetBoard() {
  const { budgetLayout, setBudgetLayout } = useBudget();
  return (
    <CardBoard
      cards={CARDS}
      layout={budgetLayout}
      defaultLayout={DEFAULT_BUDGET_LAYOUT}
      onSave={setBudgetLayout}
    />
  );
}
