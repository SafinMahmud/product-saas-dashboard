#!/usr/bin/env node

/**
 * Seeds Firestore with demo products for local development / demos.
 *
 * Usage:
 *   npm run seed              # skip if products already exist
 *   npm run seed -- --force   # clear products collection and re-seed
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const COLLECTION = "products";
const FORCE = process.argv.includes("--force");

function initAdmin() {
  if (getApps().length) return getFirestore();

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const fullPath = resolve(process.cwd(), credPath);
    if (!existsSync(fullPath)) {
      console.error(`❌ Service account file not found: ${fullPath}`);
      process.exit(1);
    }
    const sa = JSON.parse(readFileSync(fullPath, "utf-8"));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? "";
  const privateKey = rawKey.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "\n❌ Missing Firebase Admin credentials.\n" +
        "   Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY in .env.local\n"
    );
    process.exit(1);
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return getFirestore();
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const DEMO_PRODUCTS = [
  {
    name: "Single-Origin Coffee Beans",
    description:
      "Medium roast Arabica beans from Colombia. Notes of chocolate and caramel. 12 oz bag, whole bean.",
    category: "Food & Beverage",
    price: 16.5,
    status: "active",
    createdAt: daysAgo(1),
  },
  {
    name: "Organic Green Tea",
    description:
      "Loose-leaf sencha green tea sourced from Uji, Japan. Fresh grassy aroma with a smooth finish.",
    category: "Food & Beverage",
    price: 12.99,
    status: "active",
    createdAt: daysAgo(4),
  },
  {
    name: "Cold Brew Concentrate",
    description:
      "Ready-to-dilute cold brew coffee concentrate. Smooth, low-acid flavor. Makes 16 servings per bottle.",
    category: "Food & Beverage",
    price: 14.99,
    status: "active",
    createdAt: daysAgo(2),
  },
  {
    name: "Artisan Dark Chocolate Bar",
    description:
      "72% cacao single-origin dark chocolate from Ecuador. Rich, fruity notes with a clean finish.",
    category: "Food & Beverage",
    price: 8.5,
    status: "active",
    createdAt: daysAgo(6),
  },
  {
    name: "Sparkling Mineral Water (12-pack)",
    description:
      "Naturally carbonated mineral water from alpine springs. Zero calories, crisp and refreshing.",
    category: "Food & Beverage",
    price: 9.99,
    status: "active",
    createdAt: daysAgo(3),
  },
  {
    name: "Honeycrisp Apple Juice",
    description:
      "Fresh-pressed juice from Washington Honeycrisp apples. No added sugar or preservatives.",
    category: "Food & Beverage",
    price: 6.49,
    status: "inactive",
    createdAt: daysAgo(10),
  },
  {
    name: "Matcha Latte Mix",
    description:
      "Ceremonial-grade matcha powder blend with oat milk powder. Just add hot water for a café-style latte.",
    category: "Food & Beverage",
    price: 18.0,
    status: "active",
    createdAt: daysAgo(5),
  },
  {
    name: "Herbal Sleep Tea Blend",
    description:
      "Caffeine-free blend of chamomile, lavender, and valerian root. Promotes relaxation before bedtime.",
    category: "Food & Beverage",
    price: 11.25,
    status: "inactive",
    createdAt: daysAgo(14),
  },
];

async function resolveCreatedBy(db) {
  const usersSnap = await db.collection("users").limit(1).get();
  if (!usersSnap.empty) {
    return usersSnap.docs[0].id;
  }
  return "demo-seed";
}

async function clearProducts(db) {
  const snap = await db.collection(COLLECTION).get();
  if (snap.empty) return 0;

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return snap.size;
}

async function seed() {
  const db = initAdmin();
  const existing = await db.collection(COLLECTION).count().get();
  const count = existing.data().count;

  if (count > 0 && !FORCE) {
    console.log(
      `\n⚠️  Found ${count} existing product(s). Skipping seed.\n` +
        "   Run with --force to clear and re-seed:\n" +
        "   npm run seed -- --force\n"
    );
    return;
  }

  if (FORCE && count > 0) {
    const removed = await clearProducts(db);
    console.log(`🗑️  Cleared ${removed} existing product(s).`);
  }

  const createdBy = await resolveCreatedBy(db);
  const batch = db.batch();

  for (const product of DEMO_PRODUCTS) {
    const ref = db.collection(COLLECTION).doc();
    batch.set(ref, {
      ...product,
      updatedAt: product.createdAt,
      createdBy,
    });
  }

  await batch.commit();

  const active = DEMO_PRODUCTS.filter((p) => p.status === "active").length;
  const inactive = DEMO_PRODUCTS.length - active;
  const revenue = DEMO_PRODUCTS.filter((p) => p.status === "active").reduce(
    (sum, p) => sum + p.price,
    0
  );

  console.log(`\n✅ Seeded ${DEMO_PRODUCTS.length} demo products`);
  console.log(`   Active: ${active} | Inactive: ${inactive}`);
  console.log(`   Active revenue total: $${revenue.toFixed(2)}`);
  console.log(`   createdBy: ${createdBy}`);
  console.log(
    "\n   Refresh your dashboard at http://localhost:3000/dashboard\n"
  );
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
