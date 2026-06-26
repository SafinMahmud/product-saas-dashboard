"use client";

import { useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ParsedProductFilters } from "@/lib/ai/product-filter-schema";

interface AiFilterBarProps {
  activeSummary: string | null;
  onApply: (filters: ParsedProductFilters) => void;
  onClear: () => void;
}

export function AiFilterBar({
  activeSummary,
  onApply,
  onClear,
}: AiFilterBarProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/parse-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = (data as { error?: string }).error ?? "AI unavailable";
        toast.error(errorMsg);
        return;
      }

      const filters = (await res.json()) as ParsedProductFilters;
      onApply(filters);
      toast.success(filters.summary);
    } catch {
      toast.error(
        "Could not parse that query. Try something like 'active products under $20'."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try: "active products under $20" or "inactive items"'
            className="pl-9"
            aria-label="Natural language product filter"
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()} className="gap-1.5">
          <Sparkles className="size-4" aria-hidden />
          {loading ? "Parsing…" : "Ask AI"}
        </Button>
      </form>

      {activeSummary && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
          <span className="flex-1 text-muted-foreground">
            <span className="font-medium text-foreground">AI filter: </span>
            {activeSummary}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClear}
            aria-label="Clear AI filter"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
