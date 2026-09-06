export type PlanCategory = "work" | "health" | "personal" | "focus";
export type PlanItem = { hour: number; title: string; note?: string; category: PlanCategory };

export type AiMessage =
  | { role: "user"; content: string; time: string }
  | { role: "assistant"; content: string; time: string; plan: PlanItem[] | null };

export function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function hourLabel(h: number) {
  return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}
