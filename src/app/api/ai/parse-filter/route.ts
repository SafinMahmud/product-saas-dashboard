import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { withAuth, jsonError } from "@/lib/api/helpers";
import { logger } from "@/lib/logging/logger";
import { getCategories } from "@/lib/data/products";
import {
  getAiConfigError,
  getAiRateLimitError,
  getGroqModel,
  isAiRateLimitError,
} from "@/lib/ai/provider";
import {
  aiProductFilterSchema,
  mapAiFilterToParams,
} from "@/lib/ai/product-filter-schema";

export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    if (!process.env.GROQ_API_KEY) {
      return jsonError(getAiConfigError(), 503);
    }

    const body = await request.json();
    const parsed = z
      .object({
        query: z.string().min(1, "Query is required").max(500),
      })
      .safeParse(body);

    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message ?? "Invalid request",
        400
      );
    }

    const categories = await getCategories();

    try {
      const { object } = await generateObject({
        model: getGroqModel(),
        schema: aiProductFilterSchema,
        system:
          "You parse natural language product catalog queries into structured database filters. " +
          "Only set fields that are explicitly implied by the query — leave all others null. " +
          `Known categories in this catalog: ${categories.length > 0 ? categories.join(", ") : "Food & Beverage"}. ` +
          "Match category names to the known list when possible (case-insensitive). " +
          'Examples: "active electronics under $500" → status: active, category: Electronics, priceMax: 500. ' +
          '"inactive products" → status: inactive. "cheapest items" → sortBy: price, sortOrder: asc. ' +
          '"newest products" → sortBy: createdAt, sortOrder: desc. ' +
          "For price: use priceMin/priceMax as inclusive bounds. 'under $500' means priceMax: 500.",
        prompt: parsed.data.query,
      });

      const filters = mapAiFilterToParams(object, categories);
      return NextResponse.json(filters);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("AI parse-filter failed", { error: message });

      if (isAiRateLimitError(err)) {
        return jsonError(getAiRateLimitError(), 429);
      }

      return jsonError(
        "Could not understand that query. Try rephrasing, e.g. 'active products under $20'.",
        500
      );
    }
  });
}
