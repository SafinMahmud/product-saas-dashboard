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
  }).format(amount);
}

export function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  const cards = [
    {
      title: "Total Products",
      value: metrics?.totalProducts ?? "—",
      icon: Package,
    },
    {
      title: "Active Products",
      value: metrics?.activeCount ?? "—",
      icon: CheckCircle,
    },
    {
      title: "Inactive Products",
      value: metrics?.inactiveCount ?? "—",
      icon: XCircle,
    },
    {
      title: "Active Revenue",
      value: metrics ? formatCurrency(metrics.revenueTotal) : "—",
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, icon: Icon }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <Icon className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {loading ? "…" : value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
