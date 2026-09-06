import type { PlanCategory, PlanItem } from "@/lib/ai/types";
import { hourLabel } from "@/lib/ai/types";

const CAT_EMOJI: Record<PlanCategory, string> = { work: "💼", health: "💪", personal: "🌿", focus: "🎯" };

export function PlanCard({ plan, onRegenerate, onApply }: { plan: PlanItem[]; onRegenerate: () => void; onApply: () => void }) {
  return (
    <div className="ai-plan-card fade-in">
      <div className="ai-plan-header">
        <div className="ai-plan-title">✦ Your Personalized Day Plan</div>
        <div className="ai-plan-actions">
          <button className="ai-plan-btn regen" onClick={onRegenerate}>
            ↻ Regenerate
          </button>
          <button className="ai-plan-btn apply" onClick={onApply}>
            Apply to Planner →
          </button>
        </div>
      </div>
      <div className="ai-plan-body">
        {plan.map((item, i) => (
          <div key={i} className="ai-plan-item">
            <div className="ai-plan-time">{hourLabel(item.hour)}</div>
            <div className="ai-plan-event">
              <div className="ai-plan-event-title">
                {CAT_EMOJI[item.category] ?? "•"} {item.title}
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
