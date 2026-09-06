"use client";

import { useState } from "react";
import { useBudget, type Goal } from "@/lib/budget/budget-context";
import { GoalModal } from "@/components/modals/GoalModal";
import { SavingsModal } from "@/components/modals/SavingsModal";

export function SavingsGoals() {
  const { goals, addGoal, deleteGoal, applySavings } = useBudget();
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [savingsGoal, setSavingsGoal] = useState<Goal | null>(null);

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <div className="planner-card-title">⬡ Savings Goals</div>
        <button className="btn btn-ghost" style={{ fontSize: "0.68rem", padding: "3px 8px" }} onClick={() => setGoalModalOpen(true)}>
          + Goal
        </button>
      </div>
      <div className="planner-card-body">
        {goals.length === 0 ? (
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text3)", textAlign: "center" }}>
            No savings goals yet.
          </div>
        ) : (
          goals.map((g) => {
            const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
            const isComplete = pct >= 100;
            return (
              <div key={g.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--text)", fontWeight: 500 }}>
                    {isComplete ? "🎉 " : ""}
                    {g.name}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--accent2)" }}>{pct}%</span>
                    <button onClick={() => deleteGoal(g.id)} style={{ fontSize: "0.65rem", color: "var(--text3)", background: "none", border: "none", cursor: "pointer" }}>
                      ✕
                    </button>
                  </span>
                </div>
                <div style={{ height: 7, background: "var(--bg3)", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,var(--accent),var(--accent2))", borderRadius: 8 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text3)" }}>
                    ${g.saved.toFixed(2)} of ${g.target.toFixed(2)}
                  </span>
                  <button
                    onClick={() => setSavingsGoal(g)}
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "0.65rem",
                      padding: "3px 8px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      color: "var(--text2)",
                      cursor: "pointer",
                    }}
                  >
                    ± Add / Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <GoalModal
        open={goalModalOpen}
        onCancel={() => setGoalModalOpen(false)}
        onSave={(fields) => {
          addGoal(fields);
          setGoalModalOpen(false);
        }}
      />
      <SavingsModal
        open={savingsGoal !== null}
        goal={savingsGoal}
        onCancel={() => setSavingsGoal(null)}
        onApply={(amount, isAdd) => {
          if (savingsGoal) applySavings(savingsGoal.id, amount, isAdd);
          setSavingsGoal(null);
        }}
      />
    </div>
  );
}
