"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useJournal } from "@/lib/journal/journal-context";
import { usePlanner } from "@/lib/planner/planner-context";
import { useTheme } from "@/lib/theme/theme-context";
import { THEME_COPY } from "@/lib/theme/theme-copy";
import { useToast } from "@/lib/toast/toast-context";
import { planDay, type AiHistoryMessage } from "@/lib/ai/client";
import { formatTime, type AiMessage, type PlanItem } from "@/lib/ai/types";
import { AiInsights } from "@/components/ai/AiInsights";
import { AiThread } from "@/components/ai/AiThread";
import { bodyToText } from "@/lib/journal/body";
import { tasksForDay } from "@/lib/planner/tasks";

const CHIPS = [
  { emoji: "💼", label: "Productive", text: "Productive work day with deep focus blocks and regular breaks" },
  { emoji: "🌿", label: "Relaxed", text: "Relaxed Sunday with self-care, light exercise, and reading" },
  { emoji: "⚖️", label: "Balanced", text: "Balanced day mixing work, exercise, creative time, and social activities" },
  { emoji: "💪", label: "Fitness", text: "High energy fitness day with morning workout, healthy meals, and recovery" },
  { emoji: "🎨", label: "Creative", text: "Creative day focused on art, writing, music and inspiration" },
  { emoji: "🧘", label: "Mindful", text: "Minimal, meditative day with journaling, meditation, nature walks" },
];

function buildHistory(messages: AiMessage[]): AiHistoryMessage[] {
  return messages.map((m) =>
    m.role === "user"
      ? { role: "user", content: m.content }
      : { role: "assistant", content: m.content + (m.plan ? `\n<PLAN>${JSON.stringify(m.plan)}</PLAN>` : "") },
  );
}

export default function AiPlannerPage() {
  const router = useRouter();
  const { entries } = useJournal();
  const { plannerDay, todos, habits, saveEvent, addTodo } = usePlanner();
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const { showToast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function fillChip(text: string) {
    setPrompt(text);
    textareaRef.current?.focus();
  }

  async function send(rawPrompt: string) {
    const text = rawPrompt.trim();
    if (!text || sending) return;

    const userMsg: AiMessage = { role: "user", content: text, time: formatTime(new Date()) };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setPrompt("");
    setSending(true);

    const todayKey = new Date().toDateString();
    const todayTasks = tasksForDay(todos, todayKey).map((t) => t.text);
    const habitsList = habits.map((h) => h.name);
    const recentEntries = entries.slice(0, 3).map((e) => `"${e.title || "Untitled"}": ${bodyToText(e.body).substring(0, 100)}`);

    const { text: response, error } = await planDay({
      prompt: text,
      history: buildHistory(messages),
      todayTasks,
      habitsList,
      recentEntries,
    });

    setSending(false);

    if (error || !response) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error ?? "I had trouble generating your plan. Please check your connection and try again.",
          plan: null,
          time: formatTime(new Date()),
        },
      ]);
      return;
    }

    const planMatch = response.match(/<PLAN>([\s\S]*?)<\/PLAN>/);
    let planData: PlanItem[] | null = null;
    const cleanResponse = response.replace(/<PLAN>[\s\S]*?<\/PLAN>/, "").trim();
    if (planMatch) {
      try {
        planData = JSON.parse(planMatch[1].trim());
      } catch {
        planData = null;
      }
    }

    setMessages((prev) => [...prev, { role: "assistant", content: cleanResponse, plan: planData, time: formatTime(new Date()) }]);
  }

  function regeneratePlan(idx: number) {
    const prev = messages[idx - 1];
    if (prev?.role === "user") {
      send(`${prev.content} (please give me a different variation)`);
    }
  }

  function applyPlan(idx: number) {
    const msg = messages[idx];
    if (msg?.role !== "assistant" || !msg.plan) return;

    const dayKey = plannerDay.toDateString();
    msg.plan.forEach((item) => {
      saveEvent(dayKey, item.hour, item.title + (item.note ? ` — ${item.note}` : ""), true);
    });

    const workItems = msg.plan.filter((i) => i.category === "work" || i.category === "focus");
    workItems.forEach((item) => {
      if (!tasksForDay(todos, dayKey).some((t) => t.text === item.title)) {
        addTodo(item.title, "med");
      }
    });

    showToast(`✦ Plan applied! ${msg.plan.length} events added to your Day Planner for ${dayKey}.`, "success");
    router.push("/planner");
  }

  return (
    <div className="ai-layout">
      {/* One scroll container, so the banner scrolls away with the content. */}
      <div className="page-scroll">
        <div className="ai-hero page-hero">
          <div className="ai-hero-title">{copy.aiTitle}</div>
          <div className="ai-hero-sub">Describe your day, goals, or constraints — I&apos;ll build your perfect schedule.</div>
          <div className="ai-input-row">
            <textarea
              ref={textareaRef}
              className="ai-prompt-box"
              rows={2}
              placeholder="e.g. I have a team meeting at 2pm, need to finish a report, want to exercise, and have dinner with family at 7pm…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(prompt);
              }}
            />
            <button className="ai-send-btn" onClick={() => send(prompt)} disabled={sending}>
              <span>{sending ? "⬡ Planning…" : "⬡ Plan My Day"}</span>
            </button>
          </div>
          <div className="ai-chips">
            {CHIPS.map((chip) => (
              <div key={chip.label} className="ai-chip" onClick={() => fillChip(chip.text)}>
                {chip.emoji} {chip.label}
              </div>
            ))}
          </div>
        </div>
        <div className="page-body">
          <AiInsights hasMessages={messages.length > 0} />
          <AiThread messages={messages} sending={sending} onRegenerate={regeneratePlan} onApply={applyPlan} />
        </div>
      </div>
    </div>
  );
}
