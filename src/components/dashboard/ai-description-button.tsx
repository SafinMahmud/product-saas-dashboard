"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiDescriptionButtonProps {
  name: string;
  category: string;
  price: string;
  onGenerated: (description: string) => void;
}

export function AiDescriptionButton({
  name,
  category,
  price,
  onGenerated,
}: AiDescriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!name.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, price: parseFloat(price) || 0 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "AI unavailable"
        );
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        onGenerated(full);
      }
    } catch {
      onGenerated("(AI description unavailable — check OPENAI_API_KEY)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={loading || !name.trim()}
      className="gap-1.5"
    >
      <Sparkles className="size-3.5" aria-hidden />
      {loading ? "Generating…" : "AI describe"}
    </Button>
  );
}
