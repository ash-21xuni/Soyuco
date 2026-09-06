"use client";

import { useJournal } from "@/lib/journal/journal-context";
import { usePlanner } from "@/lib/planner/planner-context";

const MOOD_LABELS = ["–", "Awful", "Meh", "Okay", "Good", "Great"];

export function AiInsights({ hasMessages }: { hasMessages: boolean }) {
  const { entries } = useJournal();
  const { todos, habits, moodHistory } = usePlanner();

  const todayKey = new Date().toDateString();
  const todayTodos = todos.filter((t) => t.day === todayKey);
  const doneTodos = todayTodos.filter((t) => t.done).length;
  const habitsDone = habits.reduce((s, h) => s + h.days.filter(Boolean).length, 0);
  const moodValues = Object.values(moodHistory).filter(Boolean);
  const avgMood = moodValues.length ? Math.round((moodValues.reduce((s, v) => s + v, 0) / moodValues.length) * 10) / 10 : 0;
  const pct = todayTodos.length ? Math.round((doneTodos / todayTodos.length) * 100) : 0;

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="ai-section-title">Your Week at a Glance</div>

      <div className="ai-task-summary-box">
        <span className="summary-label">📋 Tasks Completed Today</span>
        <div className="summary-progress">
          <span className="summary-value">
            {doneTodos}/{todayTodos.length}
          </span>
          <div className="progress-bar">
            <div className="fill" style={{ width: `${pct}%` }} />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text3)" }}>{pct}%</span>
        </div>
      </div>

      <div className="ai-insights-grid">
        <div className="ai-insight-card">
          <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>📓</div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.6rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Entries
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, color: "var(--text)" }}>{entries.length}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text3)" }}>Total written</div>
        </div>
        <div className="ai-insight-card">
          <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>☑</div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.6rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Tasks
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, color: "var(--text)" }}>
            {doneTodos}/{todayTodos.length}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text3)" }}>{pct}% done</div>
        </div>
        <div className="ai-insight-card">
          <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>◈</div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.6rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Habits
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, color: "var(--text)" }}>{habitsDone}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text3)" }}>Completions this week</div>
        </div>
        <div className="ai-insight-card">
          <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>😊</div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.6rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Mood
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, color: "var(--text)" }}>{avgMood || "–"}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text3)" }}>
            {avgMood ? MOOD_LABELS[Math.round(avgMood)] : "Not set"}
          </div>
        </div>
      </div>

      {!hasMessages && (
        <>
          <div className="ai-section-title">What would you like to do?</div>
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.83rem",
              color: "var(--text2)",
              lineHeight: 1.7,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "16px 18px",
            }}
          >
            <strong style={{ color: "var(--accent2)" }}>⬡ Your AI planner can:</strong>
            <br />
            • Build a complete hourly schedule for your day
            <br />
            • Suggest tasks and priorities based on your goals
            <br />
            • Create balanced routines (work, health, rest)
            <br />
            • Apply plans directly to your Day Planner
            <br />
            <br />
            <span style={{ color: "var(--text3)" }}>Describe your day above, or pick a quick-start template.</span>
          </div>
        </>
      )}
    </div>
  );
}
