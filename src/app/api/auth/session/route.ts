import { NextRequest, NextResponse } from "next/server";
import { createSessionResponse, jsonError } from "@/lib/api/helpers";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken || typeof idToken !== "string") {
      return jsonError("Missing idToken", 400);
    }
    return createSessionResponse(idToken);
  } catch (error) {
    console.error("[auth/session]", error);
    return jsonError("Invalid credentials", 401);
  }
}
