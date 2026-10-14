import "server-only";
import { ApiError, GoogleGenAI, ThinkingLevel, type Content } from "@google/genai";
import { NextResponse } from "next/server";

// Tried in order. The newest Flash models are often overloaded (503) or slow
// to answer, so the dependable one goes first, the newer ones back it up, and
// the Lite models (lighter, but rarely busy) are the last resort.
// GEMINI_MODEL, if set, is tried before all of them.
const MODELS = [
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

// Per attempt, so one hung model can't stall the reply for a minute.
const ATTEMPT_TIMEOUT_MS = 25_000;

// Overloaded, rate-limited, retired or timed-out models are worth skipping
// past; anything else (bad key, bad request) would fail on every model.
function shouldTryNextModel(err: unknown) {
  if (!(err instanceof ApiError)) return !(err instanceof MissingApiKeyError);
  return [404, 429, 500, 502, 503, 504].includes(err.status);
}

let client: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new MissingApiKeyError();
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not set");
  }
}

class EmptyResponseError extends Error {
  constructor(reason?: string) {
    super(`Gemini returned no text${reason ? ` (${reason})` : ""}`);
  }
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * One text reply from Gemini. `thinking` sets how hard the model reasons first;
 * thinking tokens count toward `maxOutputTokens`, so leave headroom.
 */
export async function generateText({
  turns,
  system,
  thinking,
  maxOutputTokens,
}: {
  turns: ChatTurn[];
  system?: string;
  thinking: ThinkingLevel;
  maxOutputTokens: number;
}): Promise<string> {
  const contents: Content[] = turns.map((t) => ({
    role: t.role === "assistant" ? "model" : "user",
    parts: [{ text: t.content }],
  }));

  const ai = getGeminiClient();
  const models = [...new Set([process.env.GEMINI_MODEL, ...MODELS].filter((m): m is string => !!m))];

  let lastError: unknown;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: system,
          maxOutputTokens,
          thinkingConfig: { thinkingLevel: thinking },
          httpOptions: { timeout: ATTEMPT_TIMEOUT_MS },
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new EmptyResponseError(
          response.promptFeedback?.blockReason ?? response.candidates?.[0]?.finishReason,
        );
      }
      return text;
    } catch (err) {
      lastError = err;
      if (!shouldTryNextModel(err) || err instanceof EmptyResponseError) throw err;
      console.warn(`Gemini model ${model} unavailable, trying the next one:`, errorSummary(err));
    }
  }
  throw lastError;
}

function errorSummary(err: unknown) {
  if (err instanceof ApiError) return `${err.status}`;
  return err instanceof Error ? err.message : String(err);
}

export { ThinkingLevel };

export function aiErrorResponse(err: unknown) {
  if (err instanceof MissingApiKeyError) {
    return NextResponse.json(
      { error: "The AI service isn't configured yet — add GEMINI_API_KEY to .env.local." },
      { status: 501 },
    );
  }
  if (err instanceof EmptyResponseError) {
    console.error(err.message);
    return NextResponse.json(
      { error: "The AI didn't return an answer for that — try rephrasing." },
      { status: 502 },
    );
  }
  if (err instanceof ApiError) {
    if (err.status === 400 && /api key/i.test(err.message)) {
      return NextResponse.json({ error: "The AI service rejected its API key." }, { status: 502 });
    }
    if (err.status === 401 || err.status === 403) {
      return NextResponse.json({ error: "The AI service rejected its API key." }, { status: 502 });
    }
    if (err.status === 429) {
      return NextResponse.json(
        { error: "The AI service is rate-limited right now — try again shortly." },
        { status: 429 },
      );
    }
    if (err.status === 503 || err.status === 504) {
      return NextResponse.json(
        { error: "The AI is very busy right now — give it a moment and try again." },
        { status: 503 },
      );
    }
    console.error("Gemini API error:", err.status, err.message);
    return NextResponse.json({ error: "The AI service had a problem — try again shortly." }, { status: 502 });
  }
  // Every model timing out lands here too, as a plain (non-API) error.
  console.error("Unexpected AI error:", err);
  return NextResponse.json(
    { error: "Couldn't reach the AI service — check your connection and try again." },
    { status: 502 },
  );
}
