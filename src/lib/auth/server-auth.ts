import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import {
  getAdminAuth,
  getAdminDb,
} from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import type { AuthSession, UserRole } from "@/lib/types";

async function getRoleForUser(uid: string): Promise<UserRole> {
  const doc = await getAdminDb().collection("users").doc(uid).get();
  const role = doc.data()?.role as UserRole | undefined;
  return role === "admin" ? "admin" : "viewer";
}

export async function verifySessionCookie(
  sessionCookie: string
): Promise<AuthSession | null> {
  try {
    const decoded = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true
    );
    const role = await getRoleForUser(decoded.uid);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      role,
    };
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  return verifySessionCookie(sessionCookie);
}

export async function getSessionFromRequest(
  request: NextRequest
): Promise<AuthSession | null> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  return verifySessionCookie(sessionCookie);
}

export function requireAuth(session: AuthSession | null): AuthSession {
  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }
  return session;
}

export function requireAdmin(session: AuthSession): AuthSession {
  if (session.role !== "admin") {
    throw new AuthError("Forbidden: admin role required", 403);
  }
  return session;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function createUserProfile(
  decoded: DecodedIdToken,
  role: UserRole = "viewer"
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection("users").doc(decoded.uid);
  const existing = await ref.get();

  if (!existing.exists) {
    await ref.set({
      email: decoded.email ?? "",
      role,
      createdAt: new Date().toISOString(),
    });
  }
}

export function resolveSignupRole(email: string): UserRole {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase()) ? "admin" : "viewer";
}
