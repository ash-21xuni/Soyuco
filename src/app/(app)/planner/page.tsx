"use client";

import { useRouter } from "next/navigation";
import { usePlanner } from "@/lib/planner/planner-context";
import { Calendar } from "@/components/planner/Calendar";
import { Schedule } from "@/components/planner/Schedule";
import { Tasks } from "@/components/planner/Tasks";
import { Habits } from "@/components/planner/Habits";
import { MoodChart } from "@/components/planner/MoodChart";
import { DailyQuote } from "@/components/planner/DailyQuote";

export default function PlannerPage() {
  const router = useRouter();
  const { plannerDay, changeDay, goToday } = usePlanner();

  return (
    <div className="planner-layout">
      <div className="planner-header">
        <div className="planner-date-nav">
          <button className="nav-btn" onClick={() => changeDay(-1)}>
            ◀
          </button>
          <div className="planner-date-title">
            {plannerDay.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
          <button className="nav-btn" onClick={() => changeDay(1)}>
            ▶
          </button>
          <button className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "5px 10px" }} onClick={goToday}>
            Today
          </button>
        </div>
        <button className="btn btn-ai" onClick={() => router.push("/ai")}>
          ⬡ Plan with AI
        </button>
      </div>

      <div className="planner-grid">
        <div className="planner-col">
          <Calendar />
          <Schedule />
        </div>
        <div className="planner-col">
          <Tasks />
          <Habits />
          <MoodChart />
          <DailyQuote />
        </div>
      </div>
    </div>
  );
}
