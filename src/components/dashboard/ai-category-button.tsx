"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AiCategoryButtonProps {
  name: string;
  onSuggested: (category: string) => void;
}

export function AiCategoryButton({ name, onSuggested }: AiCategoryButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleSuggest() {
    if (!name.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = (data as { error?: string }).error ?? "AI unavailable";
        toast.error(errorMsg);
        return;
      }

      const data = await res.json();
      onSuggested(data.category);
      if (data.alternatives?.length > 0) {
        toast.info(`Also consider: ${data.alternatives.join(", ")}`);
      }
    } catch {
      toast.error(
        "Could not suggest category. AI service may be temporarily unavailable."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSuggest}
      disabled={loading || !name.trim()}
      className="gap-1.5"
    >
      <Sparkles className="size-3.5" aria-hidden />
      {loading ? "Thinking…" : "AI suggest"}
    </Button>
  );
}
