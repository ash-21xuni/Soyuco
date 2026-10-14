import type { PlanCategory, PlanItem } from "@/lib/ai/types";
import { hourLabel } from "@/lib/ai/types";
import { SettingsIcon, type SettingsIconName } from "@/components/settings/SettingsIcon";

const CAT_ICON: Record<PlanCategory, SettingsIconName> = {
  work: "briefcase",
  health: "dumbbell",
  personal: "leaf",
  focus: "target",
};

export function PlanCard({ plan, onRegenerate, onApply }: { plan: PlanItem[]; onRegenerate: () => void; onApply: () => void }) {
  return (
    <div className="ai-plan-card fade-in">
      <div className="ai-plan-header">
        <div className="ai-plan-title">
          <SettingsIcon name="sparkles" size={15} /> Your Personalized Day Plan
        </div>
        <div className="ai-plan-actions">
          <button className="ai-plan-btn regen" onClick={onRegenerate}>
            <SettingsIcon name="refresh" size={12} /> Regenerate
          </button>
          <button className="ai-plan-btn apply" onClick={onApply}>
            Apply to Planner <SettingsIcon name="arrowRight" size={12} />
          </button>
        </div>
      </div>
      <div className="ai-plan-body">
        {plan.map((item, i) => (
          <div key={i} className="ai-plan-item">
            <div className="ai-plan-time">{hourLabel(item.hour)}</div>
            <div className="ai-plan-event">
              <div className="ai-plan-event-title">
                <SettingsIcon name={CAT_ICON[item.category] ?? "circle"} size={13} /> {item.title}
              </div>
              {item.note && <div className="ai-plan-event-note">{item.note}</div>}
              <span className={`ai-plan-tag ${item.category}`}>{item.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
