"use client";

import { useState } from "react";
import { usePlanner, type Habit } from "@/lib/planner/planner-context";
import { weekStartKey } from "@/lib/planner/time";
import { useToast } from "@/lib/toast/toast-context";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import { SettingsIcon } from "@/components/settings/SettingsIcon";

type Tab = "settings" | "history";

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

function weekLabel(weekStart: string) {
  const [y, m, d] = weekStart.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const fmt = (x: Date) => x.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}${end.getFullYear() !== new Date().getFullYear() ? ` ${end.getFullYear()}` : ""}`;
}

function completion(habits: Habit[]) {
  const total = habits.length * 7;
  const done = habits.reduce((n, h) => n + h.days.filter(Boolean).length, 0);
  return total ? Math.round((done / total) * 100) : 0;
}

function WeekCard({ title, subtitle, habits }: { title: string; subtitle?: string; habits: Habit[] }) {
  const pct = completion(habits);
  return (
    <section className="habit-week">
      <div className="habit-week-head">
        <div>
          <div className="habit-week-title">{title}</div>
          {subtitle && <div className="habit-week-sub">{subtitle}</div>}
        </div>
        <span className="habit-week-pct">{pct}%</span>
      </div>
      <div className="habit-week-bar">
        <div style={{ width: `${pct}%` }} />
      </div>
      {habits.map((h) => (
        <div key={h.id} className="habit-week-row">
          <span className="habit-week-name">{h.name}</span>
          <span className="habit-week-days" aria-label={`${h.days.filter(Boolean).length} of 7 days`}>
            {h.days.map((on, i) => (
              <span key={i} className={`habit-week-day${on ? " on" : ""}`} title={DAY_INITIALS[i]}>
                {DAY_INITIALS[i]}
              </span>
            ))}
          </span>
          <span className="habit-week-count">{h.days.filter(Boolean).length}/7</span>
        </div>
      ))}
    </section>
  );
}

export function HabitSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { habits, habitsResetWeekly, setHabitsResetWeekly, habitHistory } = usePlanner();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("settings");
  useEscapeToClose(open, onClose);
  if (!open) return null;

  async function toggle(on: boolean) {
    setSaving(true);
    const { error } = await setHabitsResetWeekly(on);
    setSaving(false);
    showToast(
      error
        ? `Couldn't save: ${error}`
        : on
          ? "Habits will reset every Sunday, starting next week."
          : "Habits will no longer reset.",
      error ? "error" : "success",
    );
  }

  return (
    <div className="planner-settings-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="planner-settings" role="dialog" aria-modal="true" aria-labelledby="planner-settings-title">
        <div className="planner-settings-head">
          <div id="planner-settings-title" className="planner-settings-title">
            Habits
          </div>
          <button type="button" className="panel-toggle" onClick={onClose} aria-label="Close">
            <SettingsIcon name="close" />
          </button>
        </div>

        <div className="planner-settings-tabs" role="tablist">
          {(["settings", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`planner-settings-tab${tab === t ? " active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "settings" ? "Settings" : `History${habitHistory.length ? ` (${habitHistory.length})` : ""}`}
            </button>
          ))}
        </div>

        <div className="planner-settings-body">
          {tab === "settings" ? (
            <label className="planner-settings-option">
              <input
                type="checkbox"
                checked={habitsResetWeekly}
                disabled={saving}
                onChange={(e) => toggle(e.target.checked)}
              />
              <span>
                <span className="planner-settings-option-title">Reset habits every week</span>
                <span className="planner-settings-option-desc">
                  {habitsResetWeekly
                    ? "On: ticks clear every Sunday, so each week you track which days you actually did each habit. Finished weeks are saved to History."
                    : "Off: ticks stay put, so you can use them to plan which days you commit to each habit."}
                </span>
              </span>
            </label>
          ) : (
            <div className="habit-history">
              {habitsResetWeekly && habits.length > 0 && (
                <WeekCard
                  title="This week"
                  subtitle={`${weekLabel(weekStartKey())} · in progress`}
                  habits={habits}
                />
              )}
              {habitHistory.length === 0 ? (
                <div className="habit-history-empty">
                  {habitsResetWeekly
                    ? "Your first finished week will appear here after Sunday's reset."
                    : "Turn on weekly reset in Settings to start saving each week's habits here."}
                </div>
              ) : (
                habitHistory.map((w) => (
                  <WeekCard key={w.weekStart} title={weekLabel(w.weekStart)} habits={w.habits} />
                ))
              )}
            </div>
          )}
        </div>

        <div className="planner-settings-foot">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
