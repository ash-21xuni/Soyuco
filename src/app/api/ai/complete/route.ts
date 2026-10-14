import { NextRequest, NextResponse } from "next/server";
import { aiErrorResponse, generateText, ThinkingLevel } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
  }

  try {
    const text = await generateText({
      turns: [{ role: "user", content: prompt }],
      thinking: ThinkingLevel.LOW,
      maxOutputTokens: 4096,
    });
    return NextResponse.json({ text });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
