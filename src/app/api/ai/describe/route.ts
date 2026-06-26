import { NextRequest } from "next/server";
import { streamText } from "ai";
import { jsonError } from "@/lib/api/helpers";
import { getSessionFromRequest } from "@/lib/auth/server-auth";
import { logger } from "@/lib/logging/logger";
import {
  getAiConfigError,
  getAiRateLimitError,
  getGroqModel,
  isAiRateLimitError,
} from "@/lib/ai/provider";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);

  if (!process.env.GROQ_API_KEY) {
    return jsonError(getAiConfigError(), 503);
  }

  const { name, category, price } = await request.json();

  if (!name || typeof name !== "string") {
    return jsonError("Product name is required", 400);
  }

  try {
    const result = streamText({
      model: getGroqModel(),
      temperature: 0.7,
      system:
        "You are a product copywriter for an e-commerce SaaS platform. " +
        "Write concise, compelling product descriptions (2-3 sentences). " +
        "Be professional and factual. Do not invent specific technical specs.",
      prompt: `Write a product description for:\nName: ${name}\nCategory: ${category || "General"}\nPrice: $${price ?? "N/A"}`,
    });

    return result.toTextStreamResponse();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("AI describe failed", { error: message });

    if (isAiRateLimitError(err)) {
      return jsonError(getAiRateLimitError(), 429);
    }

    return jsonError("AI generation failed. Please try again later.", 500);
  }
}
