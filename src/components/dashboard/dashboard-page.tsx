"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { ProductTable } from "@/components/dashboard/product-table";
import type { DashboardMetrics } from "@/lib/types";

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const res = await fetch("/api/metrics");
      if (res.ok) {
        setMetrics(await res.json());
      }
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMetrics() {
      try {
        const res = await fetch("/api/metrics");
        if (!cancelled && res.ok) {
          setMetrics(await res.json());
        }
      } finally {
        if (!cancelled) {
          setMetricsLoading(false);
        }
      }
    }

    void loadMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sr-only">
            Dashboard metrics
          </h2>
          <MetricsCards metrics={metrics} loading={metricsLoading} />
        </section>
        <section aria-labelledby="products-heading">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2
                id="products-heading"
                className="text-xl font-semibold tracking-tight"
              >
                Products
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Browse, filter, and manage your product catalog
              </p>
            </div>
          </div>
          <ProductTable onMetricsRefresh={fetchMetrics} />
        </section>
      </main>
    </div>
  );
}
