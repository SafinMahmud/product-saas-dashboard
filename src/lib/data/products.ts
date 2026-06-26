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
    description: data.description ?? "",
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
    priceMin,
    priceMax,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const db = getAdminDb();
  const needsInMemoryFilter = Boolean(
    search || priceMin !== undefined || priceMax !== undefined
  );
  const fetchLimit = needsInMemoryFilter ? Math.min(limit * 5, 100) : limit + 1;

  let products: Product[];

  try {
    let query: Query = db.collection(COLLECTION);

    if (category) query = query.where("category", "==", category);
    if (status) query = query.where("status", "==", status);
    query = query.orderBy(sortBy, sortOrder);

    if (cursor) {
      const cursorDoc = await db.collection(COLLECTION).doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snapshot = await query.limit(fetchLimit).get();
    products = snapshot.docs.map(docToProduct);
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 9) {
      // FAILED_PRECONDITION — composite index missing or still building.
      // Fall back to unfiltered fetch + in-memory filter/sort.
      const snapshot = await db
        .collection(COLLECTION)
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();

      let all = snapshot.docs.map(docToProduct);
      if (category) all = all.filter((p) => p.category === category);
      if (status) all = all.filter((p) => p.status === status);

      all.sort((a, b) => {
        const aVal = a[sortBy as keyof Product] ?? "";
        const bVal = b[sortBy as keyof Product] ?? "";
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      products = all;
    } else {
      throw err;
    }
  }

  if (search) {
    const term = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }

  if (priceMin !== undefined) {
    products = products.filter((p) => p.price >= priceMin);
  }
  if (priceMax !== undefined) {
    products = products.filter((p) => p.price <= priceMax);
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
    description: input.description ?? "",
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
