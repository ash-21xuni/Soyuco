"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner/planner-context";
import { useTheme } from "@/lib/theme/theme-context";
import { THEME_COPY } from "@/lib/theme/theme-copy";
import { PromptModal } from "@/components/modals/PromptModal";
import { HabitSettingsModal } from "@/components/modals/HabitSettingsModal";
import { SettingsIcon } from "@/components/settings/SettingsIcon";

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

export function Habits() {
  const { habits, addHabit, toggleHabitDay, deleteHabit, habitsResetWeekly } = usePlanner();
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <div className="planner-card-title">{copy.habits}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {habitsResetWeekly && (
            <span className="habit-reset-badge" title="Ticks clear every Sunday">
              <SettingsIcon name="repeat" size={11} /> Weekly
            </span>
          )}
          <button className="btn btn-ghost" style={{ fontSize: "0.68rem", padding: "3px 8px" }} onClick={() => setOpen(true)}>
            + Habit
          </button>
          <button
            type="button"
            className="sidebar-icon-btn"
            style={{ marginLeft: 0 }}
            onClick={() => setSettingsOpen(true)}
            aria-label="Habit settings"
            title="Habit settings"
          >
            <SettingsIcon name="moreHorizontal" size={16} />
          </button>
        </div>
      </div>
      <div className="planner-card-body">
        {habits.map((h) => (
          <div key={h.id} className="habit-row">
            <div className="habit-name">{h.name}</div>
            <div className="habit-days">
              {h.days.map((d, i) => (
                <div key={i} className={`habit-day${d ? " done" : ""}`} onClick={() => toggleHabitDay(h.id, i)}>
                  {DAY_INITIALS[i]}
                </div>
              ))}
            </div>
            <button
              onClick={() => deleteHabit(h.id)}
              aria-label={`Delete ${h.name}`}
              title="Delete habit"
              style={{ display: "inline-flex", color: "var(--text3)", padding: "2px 5px", background: "none", border: "none", cursor: "pointer" }}
            >
              <SettingsIcon name="close" size={12} />
            </button>
          </div>
        ))}
      </div>

      <HabitSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <PromptModal
        open={open}
        title="Add Habit"
        label="Habit Name"
        placeholder="e.g. Morning pages, Exercise, Meditate…"
        confirmLabel="Add Habit"
        onCancel={() => setOpen(false)}
        onConfirm={(name) => {
          addHabit(name);
          setOpen(false);
        }}
      />
    </div>
  );
}
