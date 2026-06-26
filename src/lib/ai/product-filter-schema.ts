import { z } from "zod";
import type { ProductListParams, ProductStatus } from "@/lib/types";

export const aiProductFilterSchema = z.object({
  status: z
    .enum(["active", "inactive"])
    .nullable()
    .describe("Product status filter, or null if not specified"),
  category: z
    .string()
    .max(100)
    .nullable()
    .describe("Category name, or null if not specified"),
  search: z
    .string()
    .max(200)
    .nullable()
    .describe("Text search on product name, or null if not specified"),
  priceMin: z
    .number()
    .min(0)
    .nullable()
    .describe("Minimum price inclusive, or null"),
  priceMax: z
    .number()
    .min(0)
    .nullable()
    .describe("Maximum price inclusive, or null"),
  sortBy: z
    .enum(["name", "price", "createdAt"])
    .nullable()
    .describe("Sort field, or null to keep default"),
  sortOrder: z
    .enum(["asc", "desc"])
    .nullable()
    .describe("Sort direction, or null to keep default"),
  summary: z
    .string()
    .max(200)
    .describe("Brief human-readable description of the applied filters"),
});

export type AiProductFilter = z.infer<typeof aiProductFilterSchema>;

export interface ParsedProductFilters extends ProductListParams {
  summary: string;
}

function resolveCategory(
  raw: string | null | undefined,
  knownCategories: string[]
): string | undefined {
  if (!raw?.trim()) return undefined;

  const normalized = raw.trim().toLowerCase();
  const exact = knownCategories.find((c) => c.toLowerCase() === normalized);
  if (exact) return exact;

  const partial = knownCategories.find((c) =>
    c.toLowerCase().includes(normalized)
  );
  return partial ?? raw.trim();
}

export function mapAiFilterToParams(
  filter: AiProductFilter,
  knownCategories: string[]
): ParsedProductFilters {
  const category = resolveCategory(filter.category, knownCategories);
  const status = filter.status ?? undefined;
  const search = filter.search?.trim() || undefined;
  const priceMin = filter.priceMin ?? undefined;
  const priceMax = filter.priceMax ?? undefined;
  const sortBy = filter.sortBy ?? undefined;
  const sortOrder = filter.sortOrder ?? undefined;

  const parts: string[] = [];
  if (status) parts.push(`${status} products`);
  if (category) parts.push(`in ${category}`);
  if (search) parts.push(`matching "${search}"`);
  if (priceMin !== undefined && priceMax !== undefined) {
    parts.push(`$${priceMin}–$${priceMax}`);
  } else if (priceMax !== undefined) {
    parts.push(`under $${priceMax}`);
  } else if (priceMin !== undefined) {
    parts.push(`over $${priceMin}`);
  }

  const summary =
    filter.summary?.trim() ||
    (parts.length > 0 ? `Showing ${parts.join(", ")}` : "Showing all products");

  return {
    status: status as ProductStatus | undefined,
    category,
    search,
    priceMin,
    priceMax,
    sortBy: sortBy ?? undefined,
    sortOrder: sortOrder ?? undefined,
    summary,
  };
}
