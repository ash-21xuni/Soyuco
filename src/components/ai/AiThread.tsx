"use client";

import { useEffect, useRef } from "react";
import type { AiMessage, PlanItem } from "@/lib/ai/types";
import { FormattedAiText } from "./FormattedAiText";
import { PlanCard } from "./PlanCard";
import { SettingsIcon } from "@/components/settings/SettingsIcon";

export function AiThread({
  messages,
  sending,
  dayLabel,
  onRegenerate,
  onApply,
  onOpenPlanner,
}: {
  messages: AiMessage[];
  sending: boolean;
  dayLabel: string;
  onRegenerate: (idx: number) => void;
  onApply: (items: PlanItem[]) => void;
  onOpenPlanner: () => void;
}) {
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, sending]);

  return (
    <div id="aiThread" ref={threadRef}>
      {messages.map((msg, i) =>
        msg.role === "user" ? (
          <div key={i} className="ai-msg fade-in">
            <div className="ai-msg-avatar user">You</div>
            <div className="ai-msg-bubble user">
              {msg.content}
              <div className="ai-timestamp">{msg.time}</div>
            </div>
          </div>
        ) : (
          <div key={i}>
            <div className="ai-msg fade-in">
              <div className="ai-msg-avatar assistant">
                <SettingsIcon name="sparkles" size={16} />
              </div>
              <div className="ai-msg-bubble assistant">
                <FormattedAiText text={msg.content} />
                <div className="ai-timestamp">{msg.time}</div>
              </div>
            </div>
            {msg.plan && (
              <PlanCard
                plan={msg.plan}
                dayLabel={dayLabel}
                regenerating={sending}
                onRegenerate={() => onRegenerate(i)}
                onApply={onApply}
                onOpenPlanner={onOpenPlanner}
              />
            )}
          </div>
        ),
      )}
      {sending && (
        <div className="ai-msg fade-in">
          <div className="ai-msg-avatar assistant">
                <SettingsIcon name="sparkles" size={16} />
              </div>
          <div className="ai-msg-bubble assistant">
            <div className="ai-typing">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
