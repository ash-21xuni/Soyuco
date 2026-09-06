import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { aiErrorResponse, getAnthropicClient } from "@/lib/ai/anthropic";

type HistoryMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt: unknown = body.prompt;
  const history: HistoryMessage[] = Array.isArray(body.history) ? body.history : [];
  const todayTasks: string[] = Array.isArray(body.todayTasks) ? body.todayTasks : [];
  const habitsList: string[] = Array.isArray(body.habitsList) ? body.habitsList : [];
  const recentEntries: string[] = Array.isArray(body.recentEntries) ? body.recentEntries : [];

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
  }

  const systemPrompt = `You are Soyuco, an expert personal AI day planner and life coach. Your role is to create realistic, thoughtful, and personalized daily schedules.

When given a request to plan a day, always respond with:
1. A warm, brief intro (1-2 sentences)
2. A JSON plan block wrapped in <PLAN> tags in this exact format:
<PLAN>
[
  {"hour": 6, "title": "Morning Routine", "note": "Wake up, stretch, hydrate", "category": "health"},
  {"hour": 7, "title": "Breakfast & Journaling", "note": "15 min journal entry while eating", "category": "personal"}
]
</PLAN>
3. 2-3 sentences of personalized advice after the plan.

Categories must be one of: work, health, personal, focus
Hours must be integers from 5-22.
For non-planning questions, just respond naturally without a <PLAN> block.

User context:
- Existing today's tasks: ${todayTasks.length ? todayTasks.join(", ") : "None"}
- Habits they track: ${habitsList.length ? habitsList.join(", ") : "None"}
- Recent journal themes: ${recentEntries.length ? recentEntries.join(" | ") : "No entries yet"}`;

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: prompt },
  ];

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      output_config: { effort: "medium" },
      system: systemPrompt,
      messages,
    });

    const text = response.content
      .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("");

    return NextResponse.json({ text });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
