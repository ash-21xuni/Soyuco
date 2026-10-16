import { MonthNav } from "@/components/budget/MonthNav";
import { SummaryStrip } from "@/components/budget/SummaryStrip";
import { TrendChart } from "@/components/budget/TrendChart";
import { BudgetBoard } from "@/components/budget/BudgetBoard";
import { SettingsIcon } from "@/components/settings/SettingsIcon";

export default function BudgetPage() {
  return (
    <div className="ai-layout">
      {/* One scroll container, so the banner scrolls away with the content. */}
      <div className="page-scroll">
        <div className="ai-hero page-hero">
          <div className="ai-hero-title">
            <SettingsIcon name="wallet" size={22} /> Budget Planner
          </div>
          <div className="ai-hero-sub">
            Track your income, expenses, and savings goals. Recurring bills, pay and auto-saves log themselves.
          </div>
        </div>
        <div className="page-body">
          <MonthNav />
          <SummaryStrip />
          <TrendChart />
          <BudgetBoard />
        </div>
      </div>
    </div>
  );
}
