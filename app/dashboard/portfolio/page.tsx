"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, TrendingUp, TrendingDown, IndianRupee } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { MetricCard } from "@/components/ui/metric-card";
import { PortfolioPie } from "@/components/charts/portfolio-pie";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { formatCurrency, formatPercent, cn, getChangeColor } from "@/lib/utils";
import type { PortfolioMetrics } from "@/lib/upstox/types";

export default function PortfolioPage() {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portfolio/holdings")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch portfolio");
        return res.json();
      })
      .then(setMetrics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" />)}
        </div>
        <Skeleton variant="chart" className="h-72" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <GlassCard className="text-center py-12">
          <Briefcase className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="font-medium mb-1">Portfolio Unavailable</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Connect your Upstox account to view your portfolio holdings.
          </p>
          <a
            href="/api/auth/upstox"
            className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-medium"
          >
            Connect Upstox
          </a>
        </GlassCard>
      </div>
    );
  }

  const pieData = (metrics?.holdings || []).map((h) => ({
    name: h.trading_symbol || h.company_name,
    value: (h.last_price || h.average_price) * h.quantity,
  }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <Briefcase className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Portfolio</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Your holdings and performance
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={IndianRupee}
            label="Current Value"
            value={metrics.currentValue}
            format="currency"
            compact
          />
          <MetricCard
            icon={IndianRupee}
            label="Total Investment"
            value={metrics.totalInvestment}
            format="currency"
            compact
          />
          <MetricCard
            icon={TrendingUp}
            label="Total P&L"
            value={metrics.totalPnl}
            format="currency"
            change={metrics.totalPnlPercent}
            compact
          />
          <MetricCard
            icon={TrendingDown}
            label="Day P&L"
            value={metrics.dayPnl}
            format="currency"
            change={metrics.dayPnlPercent}
            compact
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        {pieData.length > 0 && (
          <PortfolioPie data={pieData} total={metrics?.currentValue} />
        )}

        {/* Holdings Table */}
        <GlassCard className="lg:col-span-2" padding="none">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">Holdings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left py-2 px-4 text-xs font-medium text-[var(--text-muted)]">Stock</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-[var(--text-muted)]">Qty</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-[var(--text-muted)]">Avg Price</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-[var(--text-muted)]">LTP</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-[var(--text-muted)]">P&L</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.holdings || []).map((h, i) => {
                  const pnl = ((h.last_price || h.average_price) - h.average_price) * h.quantity;
                  const pnlPct = ((h.last_price || h.average_price) / h.average_price - 1) * 100;
                  return (
                    <motion.tr
                      key={h.isin || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-[var(--border-subtle)] hover:bg-white/[0.02]"
                    >
                      <td className="py-2.5 px-4 font-medium">
                        {h.trading_symbol || h.company_name}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers">
                        {h.quantity}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers">
                        {formatCurrency(h.average_price)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers">
                        {formatCurrency(h.last_price || h.average_price)}
                      </td>
                      <td className={cn("py-2.5 px-4 text-right font-mono-numbers", getChangeColor(pnl))}>
                        {formatCurrency(pnl)} ({formatPercent(pnlPct)})
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {(!metrics?.holdings || metrics.holdings.length === 0) && (
              <div className="text-center py-8 text-sm text-[var(--text-muted)]">
                No holdings found
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
