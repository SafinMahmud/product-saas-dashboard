import { groq } from "@ai-sdk/groq";

export const GROQ_MODEL = "llama-3.1-8b-instant";

export function getGroqModel() {
  return groq(GROQ_MODEL);
}

export function getAiConfigError() {
  return "AI features are not configured. Please set GROQ_API_KEY.";
}

export function getAiRateLimitError() {
  return "AI rate limit reached. Groq free tier allows 30 requests/minute. Please wait a moment and try again.";
}

export function isAiRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("rate") ||
    message.includes("Rate limit")
  );
}
