"use client";

import { useEffect, useRef } from "react";
import type { AiMessage } from "@/lib/ai/types";
import { FormattedAiText } from "./FormattedAiText";
import { PlanCard } from "./PlanCard";

export function AiThread({
  messages,
  sending,
  onRegenerate,
  onApply,
}: {
  messages: AiMessage[];
  sending: boolean;
  onRegenerate: (idx: number) => void;
  onApply: (idx: number) => void;
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
              <div className="ai-msg-avatar assistant">⬡</div>
              <div className="ai-msg-bubble assistant">
                <FormattedAiText text={msg.content} />
                <div className="ai-timestamp">{msg.time}</div>
              </div>
            </div>
            {msg.plan && <PlanCard plan={msg.plan} onRegenerate={() => onRegenerate(i)} onApply={() => onApply(i)} />}
          </div>
        ),
      )}
      {sending && (
        <div className="ai-msg fade-in">
          <div className="ai-msg-avatar assistant">⬡</div>
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
