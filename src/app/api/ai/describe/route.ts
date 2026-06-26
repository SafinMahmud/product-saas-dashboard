import { NextRequest } from "next/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { jsonError } from "@/lib/api/helpers";
import { getSessionFromRequest } from "@/lib/auth/server-auth";
import { logger } from "@/lib/logging/logger";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return jsonError(
      "AI features are not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY.",
      503
    );
  }

  const { name, category, price } = await request.json();

  if (!name || typeof name !== "string") {
    return jsonError("Product name is required", 400);
  }

  try {
    const result = streamText({
      model: google("gemini-2.0-flash"),
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

    if (message.includes("429") || message.includes("quota") || message.includes("rate")) {
      return jsonError(
        "AI rate limit reached. The free tier allows 15 requests/minute. Please wait a moment and try again.",
        429
      );
    }

    return jsonError("AI generation failed. Please try again later.", 500);
  }
}
