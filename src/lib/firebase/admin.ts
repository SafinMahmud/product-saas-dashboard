import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { SESSION_COOKIE_NAME, SESSION_EXPIRY_MS } from "@/lib/auth/constants";

export { SESSION_COOKIE_NAME, SESSION_EXPIRY_MS };

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (serviceAccountPath) {
    const sa = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
    adminApp = initializeApp({ credential: cert(sa) });
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? "";
  const privateKey = rawKey.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    adminApp = initializeApp({ projectId: projectId ?? "demo-project" });
  }

  return adminApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
