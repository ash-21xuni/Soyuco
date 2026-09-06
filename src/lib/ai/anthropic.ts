import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new MissingApiKeyError();
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set");
  }
}

export function aiErrorResponse(err: unknown) {
  if (err instanceof MissingApiKeyError) {
    return NextResponse.json(
      { error: "The AI service isn't configured yet — add ANTHROPIC_API_KEY to web/.env.local." },
      { status: 501 },
    );
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return NextResponse.json({ error: "The AI service rejected its API key." }, { status: 502 });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return NextResponse.json({ error: "The AI service is rate-limited right now — try again shortly." }, { status: 429 });
  }
  if (err instanceof Anthropic.APIError) {
    return NextResponse.json({ error: `AI service error: ${err.message}` }, { status: 502 });
  }
  console.error("Unexpected AI error:", err);
  return NextResponse.json({ error: "Something went wrong talking to the AI service." }, { status: 500 });
}
