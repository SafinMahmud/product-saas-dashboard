import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { withAuth, jsonError } from "@/lib/api/helpers";

export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    if (!process.env.OPENAI_API_KEY) {
      return jsonError("AI features are disabled — OPENAI_API_KEY not configured", 503);
    }

    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return jsonError("Product name is required", 400);
    }

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        category: z.string().describe("The best-fit product category"),
        confidence: z.number().min(0).max(1).describe("Confidence score 0-1"),
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
  });
}
