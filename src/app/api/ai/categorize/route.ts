import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { withAuth, jsonError } from "@/lib/api/helpers";
import { logger } from "@/lib/logging/logger";
import {
  getAiConfigError,
  getAiRateLimitError,
  getGroqModel,
  isAiRateLimitError,
} from "@/lib/ai/provider";

export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    if (!process.env.GROQ_API_KEY) {
      return jsonError(getAiConfigError(), 503);
    }

    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return jsonError("Product name is required", 400);
    }

    try {
      const { object } = await generateObject({
        model: getGroqModel(),
        schema: z.object({
          category: z.string().describe("The best-fit product category"),
          confidence: z
            .number()
            .min(0)
            .max(1)
            .describe("Confidence score 0-1"),
          alternatives: z
            .array(z.string())
            .max(3)
            .describe("Up to 3 alternative categories"),
        }),
        system:
          "You are a product categorization engine. " +
          "Given a product name, suggest the most appropriate category. " +
          "Use common e-commerce categories like Electronics, Clothing, Home & Garden, " +
          "Sports & Outdoors, Books, Food & Beverage, Health & Beauty, Toys, Automotive, Office Supplies.",
        prompt: `Categorize this product: "${name}"`,
      });

      return NextResponse.json(object);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("AI categorize failed", { error: message });

      if (isAiRateLimitError(err)) {
        return jsonError(getAiRateLimitError(), 429);
      }

      return jsonError("AI generation failed. Please try again later.", 500);
    }
  });
}
