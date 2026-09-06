import { SummaryStrip } from "@/components/budget/SummaryStrip";
import { TrendChart } from "@/components/budget/TrendChart";
import { TransactionList } from "@/components/budget/TransactionList";
import { CategoryBreakdown } from "@/components/budget/CategoryBreakdown";
import { SavingsGoals } from "@/components/budget/SavingsGoals";
import { BudgetLimits } from "@/components/budget/BudgetLimits";

export default function BudgetPage() {
  return (
    <div className="ai-layout">
      <div className="ai-hero">
        <div className="ai-hero-title">◎ Budget Planner</div>
        <div className="ai-hero-sub">Track your income, expenses, and savings goals — all in one place.</div>
      </div>
      <div className="ai-body">
        <SummaryStrip />
        <TrendChart />
        <div className="planner-grid">
          <div className="planner-col">
            <TransactionList />
          </div>
          <div className="planner-col">
            <CategoryBreakdown />
            <SavingsGoals />
            <BudgetLimits />
          </div>
        </div>
      </div>
    </div>
  );
}
