"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "line" | "card" | "circle" | "chart";
}

export function Skeleton({ className, variant = "line" }: SkeletonProps) {
  const baseClass = "shimmer bg-white/5 rounded";

  switch (variant) {
    case "card":
      return (
        <div className={cn("glass-card p-5 space-y-3", className)}>
          <div className={cn(baseClass, "h-4 w-1/3")} />
          <div className={cn(baseClass, "h-8 w-2/3")} />
          <div className={cn(baseClass, "h-3 w-1/2")} />
        </div>
      );
    case "circle":
      return <div className={cn(baseClass, "rounded-full w-10 h-10", className)} />;
    case "chart":
      return (
        <div className={cn("glass-card p-5", className)}>
          <div className={cn(baseClass, "h-4 w-1/4 mb-4")} />
          <div className="flex items-end gap-1 h-32">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={cn(baseClass, "flex-1")}
                style={{ height: `${30 + Math.random() * 70}%` }}
              />
            ))}
          </div>
        </div>
      );
    default:
      return <div className={cn(baseClass, "h-4", className)} />;
  }
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
      {/* Chart */}
      <Skeleton variant="chart" className="h-72" />
      {/* Table */}
      <div className="glass-card p-5 space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className={`h-4 w-${[100, 90, 80, 70, 60][i]}%`} />
        ))}
      </div>
    </div>
  );
}
