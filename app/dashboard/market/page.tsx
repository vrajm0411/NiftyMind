"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { cn, formatCurrency, formatPercent, getChangeColor, getChangeBg, isMarketOpen } from "@/lib/utils";

const INDICES = [
  { name: "Nifty 50", value: 22450.75, change: 0.82, data: [22100, 22200, 22150, 22300, 22350, 22400, 22450] },
  { name: "Sensex", value: 73890.25, change: 0.76, data: [73200, 73400, 73300, 73600, 73700, 73800, 73890] },
  { name: "Bank Nifty", value: 48200.50, change: -0.34, data: [48400, 48350, 48300, 48250, 48200, 48150, 48200] },
  { name: "Nifty IT", value: 33750.00, change: 1.24, data: [33200, 33300, 33400, 33500, 33600, 33700, 33750] },
  { name: "Nifty Pharma", value: 15430.00, change: -0.56, data: [15500, 15480, 15470, 15460, 15450, 15440, 15430] },
  { name: "Nifty FMCG", value: 52100.00, change: 0.35, data: [51900, 51950, 52000, 52020, 52050, 52080, 52100] },
];

const SECTORS = [
  { name: "IT", change: 1.24, color: "#00d4ff" },
  { name: "Banking", change: -0.34, color: "#f43f5e" },
  { name: "Pharma", change: -0.56, color: "#f43f5e" },
  { name: "Auto", change: 2.1, color: "#10b981" },
  { name: "FMCG", change: 0.35, color: "#10b981" },
  { name: "Energy", change: 1.56, color: "#10b981" },
  { name: "Metals", change: -1.23, color: "#f43f5e" },
  { name: "Realty", change: 0.78, color: "#10b981" },
];

const TOP_GAINERS = [
  { symbol: "ADANIENT", price: 2850.75, change: 4.52, volume: "12.5Cr" },
  { symbol: "TATAMOTORS", price: 675.30, change: 3.18, volume: "8.3Cr" },
  { symbol: "BAJFINANCE", price: 7420.50, change: 2.85, volume: "5.7Cr" },
  { symbol: "TCS", price: 3890.25, change: 2.14, volume: "4.2Cr" },
  { symbol: "HCLTECH", price: 1520.80, change: 1.95, volume: "3.8Cr" },
];

const TOP_LOSERS = [
  { symbol: "WIPRO", price: 445.60, change: -2.31, volume: "6.1Cr" },
  { symbol: "DRREDDY", price: 5620.80, change: -1.87, volume: "2.4Cr" },
  { symbol: "SUNPHARMA", price: 1180.40, change: -1.45, volume: "3.5Cr" },
  { symbol: "BPCL", price: 345.20, change: -1.12, volume: "7.2Cr" },
  { symbol: "HINDALCO", price: 480.60, change: -0.98, volume: "4.6Cr" },
];

export default function MarketPage() {
  const marketOpen = isMarketOpen();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gold-500/10">
            <BarChart3 className="w-5 h-5 text-gold-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Market</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              NSE market overview
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", marketOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400")} />
          <span className="text-sm text-[var(--text-secondary)]">
            {marketOpen ? "Market Open" : "Market Closed"}
          </span>
        </div>
      </div>

      {/* Indices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INDICES.map((index, i) => (
          <motion.div
            key={index.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard hover className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium">{index.name}</span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded", getChangeBg(index.change))}>
                  {formatPercent(index.change)}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-xl font-semibold font-mono-numbers">
                  {index.value.toLocaleString("en-IN")}
                </span>
                <MiniSparkline data={index.data} height={35} />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Sector Heatmap */}
      <GlassCard>
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Sector Performance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SECTORS.map((sector) => (
            <div
              key={sector.name}
              className={cn(
                "p-3 rounded-lg text-center transition-colors",
                sector.change >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
              )}
            >
              <p className="text-sm font-medium mb-0.5">{sector.name}</p>
              <p className={cn("text-sm font-mono-numbers font-semibold", getChangeColor(sector.change))}>
                {formatPercent(sector.change)}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Top Movers Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard padding="none">
          <div className="flex items-center gap-2 p-4 pb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-medium">Top Gainers</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left py-2 px-4 text-xs text-[var(--text-muted)]">Symbol</th>
                <th className="text-right py-2 px-4 text-xs text-[var(--text-muted)]">Price</th>
                <th className="text-right py-2 px-4 text-xs text-[var(--text-muted)]">Change</th>
                <th className="text-right py-2 px-4 text-xs text-[var(--text-muted)]">Volume</th>
              </tr>
            </thead>
            <tbody>
              {TOP_GAINERS.map((s) => (
                <tr key={s.symbol} className="border-b border-[var(--border-subtle)] hover:bg-white/[0.02]">
                  <td className="py-2 px-4 font-medium">{s.symbol}</td>
                  <td className="py-2 px-4 text-right font-mono-numbers">{formatCurrency(s.price)}</td>
                  <td className="py-2 px-4 text-right text-emerald-400 font-mono-numbers">{formatPercent(s.change)}</td>
                  <td className="py-2 px-4 text-right text-[var(--text-muted)]">{s.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>

        <GlassCard padding="none">
          <div className="flex items-center gap-2 p-4 pb-2">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-medium">Top Losers</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left py-2 px-4 text-xs text-[var(--text-muted)]">Symbol</th>
                <th className="text-right py-2 px-4 text-xs text-[var(--text-muted)]">Price</th>
                <th className="text-right py-2 px-4 text-xs text-[var(--text-muted)]">Change</th>
                <th className="text-right py-2 px-4 text-xs text-[var(--text-muted)]">Volume</th>
              </tr>
            </thead>
            <tbody>
              {TOP_LOSERS.map((s) => (
                <tr key={s.symbol} className="border-b border-[var(--border-subtle)] hover:bg-white/[0.02]">
                  <td className="py-2 px-4 font-medium">{s.symbol}</td>
                  <td className="py-2 px-4 text-right font-mono-numbers">{formatCurrency(s.price)}</td>
                  <td className="py-2 px-4 text-right text-rose-400 font-mono-numbers">{formatPercent(s.change)}</td>
                  <td className="py-2 px-4 text-right text-[var(--text-muted)]">{s.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );
}
