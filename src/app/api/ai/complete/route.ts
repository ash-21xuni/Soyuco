import { NextRequest, NextResponse } from "next/server";
import { aiErrorResponse, getAnthropicClient } from "@/lib/ai/anthropic";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: prompt }],
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
