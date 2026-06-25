import { NextRequest, NextResponse } from "next/server";
import { jsonError, withAdmin, withAuth } from "@/lib/api/helpers";
import { deleteProduct, getProduct, updateProduct } from "@/lib/data/products";
import { productUpdateSchema } from "@/lib/validation/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return withAuth(request, async () => {
    const { id } = await context.params;
    const product = await getProduct(id);
    if (!product) return jsonError("Product not found", 404);
    return NextResponse.json(product);
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withAdmin(request, async () => {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const product = await updateProduct(id, parsed.data);
    if (!product) return jsonError("Product not found", 404);
    return NextResponse.json(product);
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withAdmin(request, async () => {
    const { id } = await context.params;
    const deleted = await deleteProduct(id);
    if (!deleted) return jsonError("Product not found", 404);
    return NextResponse.json({ success: true });
  });
}
