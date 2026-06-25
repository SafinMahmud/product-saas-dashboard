import { NextRequest, NextResponse } from "next/server";
import {
  getAdminAuth,
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_MS,
} from "@/lib/firebase/admin";
import {
  AuthError,
  createUserProfile,
  getSessionFromRequest,
  requireAdmin,
  requireAuth,
  resolveSignupRole,
} from "@/lib/auth/server-auth";
import { logger } from "@/lib/logging/logger";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function withAuth(
  request: NextRequest,
  handler: (
    session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>
  ) => Promise<NextResponse>
) {
  try {
    const session = requireAuth(await getSessionFromRequest(request));
    return handler(session);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    console.error("[API]", error);
    logger.error("Unhandled API error", { error: String(error) });
    return jsonError("Internal server error", 500);
  }
}

export async function withAdmin(
  request: NextRequest,
  handler: (
    session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>
  ) => Promise<NextResponse>
) {
  return withAuth(request, async (session) => {
    try {
      requireAdmin(session);
      return handler(session);
    } catch (error) {
      if (error instanceof AuthError) {
        return jsonError(error.message, error.status);
      }
      throw error;
    }
  });
}

export async function createSessionResponse(idToken: string) {
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  const role = resolveSignupRole(decoded.email ?? "");
  await createUserProfile(decoded, role);

  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRY_MS,
  });

  const response = NextResponse.json({
    user: { uid: decoded.uid, email: decoded.email, role },
  });

  response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_MS / 1000,
    path: "/",
  });

  return response;
}
