"use client";

import { usePlanner } from "@/lib/planner/planner-context";

function getLast7Days() {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

const MOOD_LABELS = ["", "Awful", "Meh", "Okay", "Good", "Great"];

export function MoodChart() {
  const { moodHistory } = usePlanner();
  const days = getLast7Days();
  const today = new Date().toDateString();

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <div className="planner-card-title">📈 Mood This Week</div>
      </div>
      <div className="planner-card-body">
        <div className="mood-chart">
          {days.map((d) => {
            const key = d.toDateString();
            const val = moodHistory[key] || 0;
            const isToday = key === today;
            const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
            const height = val ? val * 12 : 4;
            const opacity = val ? (isToday ? 1 : 0.6) : 0.2;
            const color = isToday ? "var(--accent2)" : "var(--accent)";
            const title = `${dayLabel}: ${val ? MOOD_LABELS[val] : "–"}`;

            return (
              <div
                key={key}
                className={`mood-bar-item${isToday ? " mood-today" : ""}`}
                style={{ height, opacity, background: color, flex: 1, margin: "0 2px", borderRadius: "2px 2px 0 0" }}
                data-label={dayLabel}
                title={title}
              />
            );
          })}
        </div>
        <div style={{ paddingTop: 20 }} />
      </div>
    </div>
  );
}
