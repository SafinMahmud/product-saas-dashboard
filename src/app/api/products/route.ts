import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/helpers";
import { createProduct, listProducts } from "@/lib/data/products";
import {
  productListQuerySchema,
  productSchema,
  productUpdateSchema,
} from "@/lib/validation/schemas";
import { withAdmin, withAuth } from "@/lib/api/helpers";

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = productListQuerySchema.safeParse(params);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const result = await listProducts(parsed.data);
    return NextResponse.json(result);
  });
}

export async function POST(request: NextRequest) {
  return withAdmin(request, async (session) => {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const product = await createProduct(parsed.data, session.uid);
    return NextResponse.json(product, { status: 201 });
  });
}
