"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductFormDialog } from "@/components/dashboard/product-form-dialog";
import { AiFilterBar } from "@/components/dashboard/ai-filter-bar";
import type { ParsedProductFilters } from "@/lib/ai/product-filter-schema";
import type { Product } from "@/lib/types";

interface ProductTableProps {
  onMetricsRefresh?: () => void;
}

export function ProductTable({ onMetricsRefresh }: ProductTableProps) {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [priceMin, setPriceMin] = useState<number | undefined>();
  const [priceMax, setPriceMax] = useState<number | undefined>();
  const [aiFilterSummary, setAiFilterSummary] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "price" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(
    async (opts?: { append?: boolean; cursorOverride?: string | null }) => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "10");
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (status !== "all") params.set("status", status);
      if (priceMin !== undefined) params.set("priceMin", String(priceMin));
      if (priceMax !== undefined) params.set("priceMax", String(priceMax));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const useCursor = opts?.cursorOverride !== undefined ? opts.cursorOverride : cursor;
      if (useCursor) params.set("cursor", useCursor);

      try {
        const res = await fetch(`/api/products?${params}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();

        setProducts((prev) =>
          opts?.append ? [...prev, ...data.products] : data.products
        );
        setNextCursor(data.nextCursor);
      } catch {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [search, category, status, priceMin, priceMax, sortBy, sortOrder, cursor]
  );

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/metrics?type=categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories ?? []);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "10");
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (status !== "all") params.set("status", status);
      if (priceMin !== undefined) params.set("priceMin", String(priceMin));
      if (priceMax !== undefined) params.set("priceMax", String(priceMax));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      try {
        const res = await fetch(`/api/products?${params}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        if (!cancelled) {
          setProducts(data.products);
          setNextCursor(data.nextCursor);
          setCursor(null);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadCategories() {
      const res = await fetch("/api/metrics?type=categories");
      if (!cancelled && res.ok) {
        const data = await res.json();
        setCategories(data.categories ?? []);
      }
    }

    void loadProducts();
    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, [search, category, status, priceMin, priceMax, sortBy, sortOrder]);

  function handleAiFilter(filters: ParsedProductFilters) {
    setSearch(filters.search ?? "");
    setCategory(filters.category ?? "all");
    setStatus(filters.status ?? "all");
    setPriceMin(filters.priceMin);
    setPriceMax(filters.priceMax);
    if (filters.sortBy) setSortBy(filters.sortBy);
    if (filters.sortOrder) setSortOrder(filters.sortOrder);
    setAiFilterSummary(filters.summary);
    setCursor(null);
  }

  function handleClearAiFilter() {
    setSearch("");
    setCategory("all");
    setStatus("all");
    setPriceMin(undefined);
    setPriceMax(undefined);
    setSortBy("createdAt");
    setSortOrder("desc");
    setAiFilterSummary(null);
    setCursor(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete product");
      return;
    }
    toast.success("Product deleted");
    setCursor(null);
    fetchProducts({ append: false, cursorOverride: null });
    onMetricsRefresh?.();
    fetchCategories();
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setDialogOpen(true);
  }

  function handleCreate() {
    setEditingProduct(null);
    setDialogOpen(true);
  }

  function handleSaved() {
    setDialogOpen(false);
    setEditingProduct(null);
    setCursor(null);
    fetchProducts({ append: false, cursorOverride: null });
    onMetricsRefresh?.();
    fetchCategories();
  }

  return (
    <div className="space-y-4">
      <AiFilterBar
        activeSummary={aiFilterSummary}
        onApply={handleAiFilter}
        onClear={handleClearAiFilter}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
            aria-label="Search products"
          />
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => v && setStatus(v)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(v) => {
              if (!v) return;
              const [field, order] = v.split("-") as [
                typeof sortBy,
                typeof sortOrder,
              ];
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest first</SelectItem>
              <SelectItem value="createdAt-asc">Oldest first</SelectItem>
              <SelectItem value="name-asc">Name A–Z</SelectItem>
              <SelectItem value="name-desc">Name Z–A</SelectItem>
              <SelectItem value="price-desc">Price high–low</SelectItem>
              <SelectItem value="price-asc">Price low–high</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="size-4" aria-hidden />
            Add product
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    ${product.price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.status === "active" ? "default" : "secondary"}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(product.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(product)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(product.id)}
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => {
              setCursor(nextCursor);
              fetchProducts({ append: true, cursorOverride: nextCursor });
            }}
          >
            Load more
          </Button>
        </div>
      )}

      {isAdmin && (
        <ProductFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={editingProduct}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
