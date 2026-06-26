"use client";

import { Package, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardMetrics } from "@/lib/types";

interface MetricsCardsProps {
  metrics: DashboardMetrics | null;
  loading?: boolean;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  const cards = [
    {
      title: "Total Products",
      value: metrics?.totalProducts ?? "—",
      icon: Package,
      accent: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Active",
      value: metrics?.activeCount ?? "—",
      icon: CheckCircle,
      accent: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Inactive",
      value: metrics?.inactiveCount ?? "—",
      icon: XCircle,
      accent: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/40",
    },
    {
      title: "Active Revenue",
      value: metrics ? formatCurrency(metrics.revenueTotal) : "—",
      icon: DollarSign,
      accent: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/40",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, accent, bg }) => (
        <Card key={title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <div className={`rounded-md p-1.5 ${bg}`}>
              <Icon className={`size-4 ${accent}`} aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {loading ? "…" : value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
