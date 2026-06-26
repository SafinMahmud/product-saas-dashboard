#!/usr/bin/env node

/**
 * Seeds Firestore with demo products for local development / demos.
 *
 * Usage:
 *   npm run seed              # skip if products already exist
 *   npm run seed -- --force   # clear products collection and re-seed
 */

const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

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
    name: "Wireless Bluetooth Headphones",
    description:
      "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and multipoint Bluetooth 5.3 connectivity.",
    category: "Electronics",
    price: 79.99,
    status: "active",
    createdAt: daysAgo(2),
  },
  {
    name: "Mechanical Keyboard Pro",
    description:
      "Compact 75% layout mechanical keyboard with hot-swappable switches, RGB backlighting, and USB-C connection.",
    category: "Electronics",
    price: 129.0,
    status: "active",
    createdAt: daysAgo(5),
  },
  {
    name: '27" 4K Monitor',
    description:
      "Ultra-sharp 4K IPS display with 99% sRGB coverage, height-adjustable stand, and USB-C hub built in.",
    category: "Electronics",
    price: 349.99,
    status: "active",
    createdAt: daysAgo(12),
  },
  {
    name: "Organic Cotton Hoodie",
    description:
      "Soft unisex hoodie made from 100% organic cotton. Relaxed fit with kangaroo pocket and ribbed cuffs.",
    category: "Clothing",
    price: 54.5,
    status: "active",
    createdAt: daysAgo(8),
  },
  {
    name: "Running Sneakers Lite",
    description:
      "Lightweight mesh running shoes with responsive foam midsole and durable rubber outsole for daily training.",
    category: "Clothing",
    price: 89.0,
    status: "inactive",
    createdAt: daysAgo(20),
  },
  {
    name: "LED Desk Lamp",
    description:
      "Adjustable desk lamp with warm-to-cool color temperature, touch dimmer, and USB charging port.",
    category: "Home & Garden",
    price: 42.99,
    status: "active",
    createdAt: daysAgo(3),
  },
  {
    name: "Ceramic Plant Pot Set",
    description:
      "Set of three minimalist ceramic planters with drainage holes and bamboo saucers. Ideal for succulents and herbs.",
    category: "Home & Garden",
    price: 28.0,
    status: "active",
    createdAt: daysAgo(15),
  },
  {
    name: "Premium Yoga Mat",
    description:
      "Non-slip 6mm yoga mat with alignment lines, eco-friendly TPE material, and carrying strap included.",
    category: "Sports & Outdoors",
    price: 36.99,
    status: "active",
    createdAt: daysAgo(7),
  },
  {
    name: "Adjustable Dumbbell Set",
    description:
      "Pair of adjustable dumbbells from 5–25 lbs per hand. Space-saving design for home workouts.",
    category: "Sports & Outdoors",
    price: 199.99,
    status: "inactive",
    createdAt: daysAgo(30),
  },
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
    name: "Hydrating Face Moisturizer",
    description:
      "Daily moisturizer with hyaluronic acid and SPF 30. Lightweight, non-greasy formula for all skin types.",
    category: "Health & Beauty",
    price: 24.0,
    status: "active",
    createdAt: daysAgo(10),
  },
  {
    name: "Clean Code (Paperback)",
    description:
      "Classic software craftsmanship guide by Robert C. Martin. Essential reading for professional developers.",
    category: "Books",
    price: 34.99,
    status: "active",
    createdAt: daysAgo(25),
  },
  {
    name: "Executive Notebook Set",
    description:
      "Pack of three A5 hardcover notebooks with dotted pages, elastic closure, and inner pocket.",
    category: "Office Supplies",
    price: 18.75,
    status: "active",
    createdAt: daysAgo(6),
  },
  {
    name: "USB-C Docking Station",
    description:
      "12-in-1 hub with dual HDMI, Ethernet, SD card reader, and 100W power delivery passthrough.",
    category: "Electronics",
    price: 89.99,
    status: "inactive",
    createdAt: daysAgo(18),
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
  console.log("\n   Refresh your dashboard at http://localhost:3000/dashboard\n");
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
