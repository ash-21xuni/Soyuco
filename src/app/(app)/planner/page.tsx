"use client";

import { useRouter } from "next/navigation";
import { usePlanner } from "@/lib/planner/planner-context";
import { PlannerBoard } from "@/components/planner/PlannerBoard";
import { SettingsIcon } from "@/components/settings/SettingsIcon";

export default function PlannerPage() {
  const router = useRouter();
  const { plannerDay, changeDay, goToday } = usePlanner();

  return (
    <div className="planner-layout">
      <div className="planner-header">
        <div className="planner-date-nav">
          <button className="nav-btn" onClick={() => changeDay(-1)} aria-label="Previous day">
            <SettingsIcon name="chevronLeft" size={14} />
          </button>
          <div className="planner-date-title">
            {plannerDay.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
          <button className="nav-btn" onClick={() => changeDay(1)} aria-label="Next day">
            <SettingsIcon name="chevronRight" size={14} />
          </button>
          <button className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "5px 10px" }} onClick={goToday}>
            Today
          </button>
        </div>
        <button className="btn btn-ai" onClick={() => router.push("/ai")}>
          <SettingsIcon name="sparkles" size={14} /> Plan with AI
        </button>
      </div>

      <PlannerBoard />
    </div>
  );
}
