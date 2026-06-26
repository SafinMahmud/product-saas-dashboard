import {
  type DocumentSnapshot,
  type Query,
} from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type {
  DashboardMetrics,
  Product,
  ProductInput,
  ProductListParams,
  ProductListResult,
  ProductStatus,
} from "@/lib/types";

const COLLECTION = "products";

function docToProduct(doc: DocumentSnapshot): Product {
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    category: data.category,
    price: data.price,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    createdBy: data.createdBy,
  };
}

export async function listProducts(
  params: ProductListParams = {}
): Promise<ProductListResult> {
  const {
    limit = 10,
    cursor,
    search,
    category,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const db = getAdminDb();
  let query: Query = db.collection(COLLECTION);

  if (category) {
    query = query.where("category", "==", category);
  }
  if (status) {
    query = query.where("status", "==", status);
  }

  // Firestore requires composite indexes when combining inequality + orderBy on different fields.
  // For search we filter in-memory after fetch when a text query is present.
  query = query.orderBy(sortBy, sortOrder);

  if (cursor) {
    const cursorDoc = await db.collection(COLLECTION).doc(cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const fetchLimit = search ? Math.min(limit * 5, 100) : limit + 1;
  const snapshot = await query.limit(fetchLimit).get();

  let products = snapshot.docs.map(docToProduct);

  if (search) {
    const term = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }

  const hasMore = products.length > limit;
  const page = products.slice(0, limit);
  const nextCursor =
    hasMore && page.length > 0 ? page[page.length - 1]!.id : null;

  const totalSnapshot = await db.collection(COLLECTION).count().get();
  const total = totalSnapshot.data().count;

  return { products: page, nextCursor, total };
}

export async function getProduct(id: string): Promise<Product | null> {
  const doc = await getAdminDb().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return docToProduct(doc);
}

export async function createProduct(
  input: ProductInput,
  userId: string
): Promise<Product> {
  const now = new Date().toISOString();
  const ref = getAdminDb().collection(COLLECTION).doc();
  const data = {
    ...input,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
  };
  await ref.set(data);
  return { id: ref.id, ...data };
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<Product | null> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const updatedAt = new Date().toISOString();
  await ref.update({ ...input, updatedAt });
  return docToProduct(await ref.get());
}

export async function deleteProduct(id: string): Promise<boolean> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return false;
  await ref.delete();
  return true;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const db = getAdminDb();
  const snapshot = await db.collection(COLLECTION).get();

  let activeCount = 0;
  let inactiveCount = 0;
  let revenueTotal = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const status = data.status as ProductStatus;
    const price = Number(data.price) || 0;

    if (status === "active") {
      activeCount++;
      revenueTotal += price;
    } else {
      inactiveCount++;
    }
  });

  return {
    totalProducts: snapshot.size,
    activeCount,
    inactiveCount,
    revenueTotal,
  };
}

export async function getCategories(): Promise<string[]> {
  const snapshot = await getAdminDb().collection(COLLECTION).select("category").get();
  const categories = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const category = doc.data().category as string | undefined;
    if (category) categories.add(category);
  });
  return Array.from(categories).sort();
}
