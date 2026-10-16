"use client";

import { useState } from "react";
import { useBudget, type Goal } from "@/lib/budget/budget-context";
import { monthKey, monthLabel, shiftMonth, todayStr } from "@/lib/budget/recurring";
import { GoalModal } from "@/components/modals/GoalModal";
import { SavingsModal } from "@/components/modals/SavingsModal";
import { SettingsCardTitle, SettingsIcon } from "@/components/settings/SettingsIcon";
import { useCurrency } from "@/lib/budget/currency";

// When a goal on auto-save will be reached. This month's amount has already
// gone in, so the remaining months start from next month.
function finishMonth(g: Goal) {
  const months = Math.ceil((g.target - g.saved) / g.monthly);
  return monthLabel(shiftMonth(g.lastContribution ?? monthKey(todayStr()), months));
}

export function SavingsGoals() {
  const { goals, addGoal, updateGoal, deleteGoal, applySavings } = useBudget();
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const { money } = useCurrency();
  const [savingsGoal, setSavingsGoal] = useState<Goal | null>(null);

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <SettingsCardTitle icon="piggyBank">Savings Goals</SettingsCardTitle>
        <button className="btn btn-ghost" style={{ fontSize: "0.68rem", padding: "3px 8px" }} onClick={() => {
            setEditingGoal(null);
            setGoalModalOpen(true);
          }}>
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
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--text)", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                    {isComplete && (
                      <span style={{ color: "var(--success)", display: "inline-flex" }} title="Goal reached">
                        <SettingsIcon name="checkCircle" size={14} />
                      </span>
                    )}
                    {g.name}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--accent2)" }}>{pct}%</span>
                    <button
                      onClick={() => {
                        setEditingGoal(g);
                        setGoalModalOpen(true);
                      }}
                      style={{ fontSize: "0.65rem", color: "var(--text3)", background: "none", border: "none", cursor: "pointer" }}
                      aria-label={`Edit ${g.name}`}
                    >
                      <SettingsIcon name="pencil" size={12} />
                    </button>
                  </span>
                </div>
                <div style={{ height: 7, background: "var(--bg3)", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,var(--accent),var(--accent2))", borderRadius: 8 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text3)" }}>
                    {money(g.saved)} of {money(g.target)}
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
                {g.monthly > 0 && !isComplete && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text3)", display: "flex", alignItems: "center", gap: 5 }}>
                    <SettingsIcon name="repeat" size={11} /> {money(g.monthly, true)}/mo auto-save · reached by {finishMonth(g)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <GoalModal
        open={goalModalOpen}
        editing={editingGoal}
        onCancel={() => setGoalModalOpen(false)}
        onSave={({ saved, ...fields }) => {
          if (editingGoal) updateGoal(editingGoal.id, fields);
          else addGoal({ ...fields, saved });
          setGoalModalOpen(false);
        }}
        onDelete={
          editingGoal
            ? () => {
                deleteGoal(editingGoal.id);
                setGoalModalOpen(false);
              }
            : undefined
        }
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
