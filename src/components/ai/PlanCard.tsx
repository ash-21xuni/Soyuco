"use client";

import { useState } from "react";
import type { PlanCategory, PlanItem } from "@/lib/ai/types";
import { hourLabel } from "@/lib/ai/types";
import { SettingsIcon, type SettingsIconName } from "@/components/settings/SettingsIcon";

const CAT_ICON: Record<PlanCategory, SettingsIconName> = {
  work: "briefcase",
  health: "dumbbell",
  personal: "leaf",
  focus: "target",
};

// The AI's suggestions as a checklist: pick the ones you want, then add just
// those to the Day Planner. Added items stay ticked off so they aren't added twice.
export function PlanCard({
  plan,
  dayLabel,
  regenerating,
  onRegenerate,
  onApply,
  onOpenPlanner,
}: {
  plan: PlanItem[];
  dayLabel: string;
  regenerating: boolean;
  onRegenerate: () => void;
  onApply: (items: PlanItem[]) => void;
  onOpenPlanner: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(plan.map((_, i) => i)));
  const [added, setAdded] = useState<Set<number>>(() => new Set());

  const available = plan.map((_, i) => i).filter((i) => !added.has(i));
  const picked = available.filter((i) => selected.has(i));
  const allPicked = available.length > 0 && picked.length === available.length;

  function toggle(i: number) {
    if (added.has(i)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function apply() {
    if (!picked.length) return;
    onApply(picked.map((i) => plan[i]));
    setAdded((prev) => new Set([...prev, ...picked]));
  }

  return (
    <div className="ai-plan-card fade-in">
      <div className="ai-plan-header">
        <div className="ai-plan-title">
          <SettingsIcon name="sparkles" size={15} /> Suggested plan
        </div>
        <div className="ai-plan-meta">
          {available.length > 0 ? (
            <>
              <span>
                {picked.length} of {available.length} selected
              </span>
              <button
                type="button"
                className="ai-plan-link"
                onClick={() => setSelected(allPicked ? new Set() : new Set(available))}
              >
                {allPicked ? "Clear" : "Select all"}
              </button>
            </>
          ) : (
            <span>All added to your planner</span>
          )}
        </div>
      </div>

      <div className="ai-plan-body" role="group" aria-label="Plan suggestions">
        {plan.map((item, i) => {
          const isAdded = added.has(i);
          const isOn = isAdded || selected.has(i);
          return (
            <button
              key={i}
              type="button"
              role="checkbox"
              aria-checked={isOn}
              aria-disabled={isAdded}
              className={`ai-plan-item${isOn ? " is-selected" : ""}${isAdded ? " is-added" : ""}`}
              onClick={() => toggle(i)}
            >
              <span className="ai-plan-check" aria-hidden="true">
                {isOn && <SettingsIcon name="check" size={12} />}
              </span>
              <span className="ai-plan-time">{hourLabel(item.hour)}</span>
              <span className="ai-plan-event">
                <span className="ai-plan-event-title">
                  <SettingsIcon name={CAT_ICON[item.category] ?? "circle"} size={13} /> {item.title}
                </span>
                {item.note && <span className="ai-plan-event-note">{item.note}</span>}
              </span>
              {isAdded ? (
                <span className="ai-plan-added">
                  <SettingsIcon name="checkCircle" size={12} /> Added
                </span>
              ) : (
                <span className={`ai-plan-tag ${item.category}`}>{item.category}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="ai-plan-footer">
        <span className="ai-plan-day">
          <SettingsIcon name="calendar" size={12} /> {dayLabel}
        </span>
        <div className="ai-plan-actions">
          <button type="button" className="btn btn-ghost" onClick={onRegenerate} disabled={regenerating}>
            <SettingsIcon name={regenerating ? "loader" : "refresh"} size={13} /> Regenerate
          </button>
          {added.size > 0 && (
            <button type="button" className="btn btn-ghost" onClick={onOpenPlanner}>
              <SettingsIcon name="layoutDashboard" size={13} /> Open Planner
            </button>
          )}
          {available.length > 0 && (
            <button type="button" className="btn btn-ai" onClick={apply} disabled={!picked.length}>
              <SettingsIcon name="plus" size={13} />
              {picked.length ? `Add ${picked.length} to Planner` : "Select items to add"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
