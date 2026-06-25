import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { getDashboardMetrics, getCategories } from "@/lib/data/products";

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    const type = request.nextUrl.searchParams.get("type");

    if (type === "categories") {
      const categories = await getCategories();
      return NextResponse.json({ categories });
    }

    const metrics = await getDashboardMetrics();
    return NextResponse.json(metrics);
  });
}
