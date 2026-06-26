import { NextRequest } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { jsonError } from "@/lib/api/helpers";
import { getSessionFromRequest } from "@/lib/auth/server-auth";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);

  if (!process.env.OPENAI_API_KEY) {
    return jsonError("AI features are disabled — OPENAI_API_KEY not configured", 503);
  }

  const { name, category, price } = await request.json();

  if (!name || typeof name !== "string") {
    return jsonError("Product name is required", 400);
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    temperature: 0.7,
    system:
      "You are a product copywriter for an e-commerce SaaS platform. " +
      "Write concise, compelling product descriptions (2-3 sentences). " +
      "Be professional and factual. Do not invent specific technical specs.",
    prompt: `Write a product description for:
Name: ${name}
Category: ${category || "General"}
Price: $${price ?? "N/A"}`,
  });

  return result.toTextStreamResponse();
}
