#!/usr/bin/env node

/**
 * Validates required environment variables before starting the dev server.
 * Run: node scripts/check-env.js
 */

const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const missing = required.filter((key) => {
  const value = process.env[key];
  return !value || value.trim() === "" || value.includes("your-");
});

if (missing.length > 0) {
  console.error("\n❌ Missing or placeholder env vars in .env.local:\n");
  missing.forEach((k) => console.error(`   - ${k}`));
  console.error("\nSee docs/FIREBASE_SETUP.md for step-by-step Firebase setup.\n");
  process.exit(1);
}

console.log("✅ Environment variables look configured.\n");
