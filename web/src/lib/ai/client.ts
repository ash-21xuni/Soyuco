export type AiHistoryMessage = { role: "user" | "assistant"; content: string };

async function postJson<T>(url: string, body: unknown): Promise<T & { error?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function completeText(prompt: string): Promise<{ text?: string; error?: string }> {
  return postJson("/api/ai/complete", { prompt });
}

export async function planDay(params: {
  prompt: string;
  history: AiHistoryMessage[];
  todayTasks: string[];
  habitsList: string[];
  recentEntries: string[];
}): Promise<{ text?: string; error?: string }> {
  return postJson("/api/ai/plan", params);
}
