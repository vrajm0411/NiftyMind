"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Briefcase,
  Brain,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { cn, isMarketOpen, formatCurrency, formatPercent, getChangeBg } from "@/lib/utils";

// Fallback demo data when not connected
const DEMO_INDICES = [
  { name: "Nifty 50", value: 22450.75, change: 0.82, data: [22100, 22200, 22150, 22300, 22350, 22400, 22450] },
  { name: "Sensex", value: 73890.25, change: 0.76, data: [73200, 73400, 73300, 73600, 73700, 73800, 73890] },
  { name: "Bank Nifty", value: 48200.50, change: -0.34, data: [48400, 48350, 48300, 48250, 48200, 48150, 48200] },
  { name: "Nifty IT", value: 33750.00, change: 1.24, data: [33200, 33300, 33400, 33500, 33600, 33700, 33750] },
];

const DEMO_MOVERS = {
  gainers: [
    { symbol: "ADANIENT", price: 2850.75, change: 4.52 },
    { symbol: "TATAMOTORS", price: 675.30, change: 3.18 },
    { symbol: "BAJFINANCE", price: 7420.50, change: 2.85 },
    { symbol: "TCS", price: 3890.25, change: 2.14 },
  ],
  losers: [
    { symbol: "WIPRO", price: 445.60, change: -2.31 },
    { symbol: "DRREDDY", price: 5620.80, change: -1.87 },
    { symbol: "SUNPHARMA", price: 1180.40, change: -1.45 },
    { symbol: "BPCL", price: 345.20, change: -1.12 },
  ],
};

interface IndexData {
  name: string;
  value: number;
  change: number;
  data: number[];
}

interface MoverStock {
  symbol: string;
  price: number;
  change: number;
}

export default function DashboardOverview() {
  const marketOpen = isMarketOpen();
  const [indices, setIndices] = useState<IndexData[]>(DEMO_INDICES);
  const [movers, setMovers] = useState<{ gainers: MoverStock[]; losers: MoverStock[] }>(DEMO_MOVERS);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveData = async () => {
    setRefreshing(true);
    try {
      const [indicesRes, moversRes] = await Promise.allSettled([
        fetch("/api/market/indices"),
        fetch("/api/market/movers"),
      ]);

      // Process indices
      if (indicesRes.status === "fulfilled" && indicesRes.value.ok) {
        const data = await indicesRes.value.json();
        if (data.indices && data.indices.length > 0) {
          const parsed: IndexData[] = data.indices.map((idx: any) => {
            const quote = idx.data?.data?.[Object.keys(idx.data?.data || {})[0]];
            const lastPrice = quote?.last_price ?? 0;
            const ohlcClose = quote?.ohlc?.close ?? lastPrice;
            const pctChange = ohlcClose > 0 ? ((lastPrice - ohlcClose) / ohlcClose) * 100 : 0;
            return {
              name: idx.name,
              value: lastPrice,
              change: +pctChange.toFixed(2),
              data: [ohlcClose, lastPrice], // minimal sparkline
            };
          });
          if (parsed.some((p) => p.value > 0)) {
            setIndices(parsed);
            setIsLive(true);
          }
        }
      }

      // Process movers
      if (moversRes.status === "fulfilled" && moversRes.value.ok) {
        const data = await moversRes.value.json();
        if (data.gainers?.length || data.losers?.length) {
          setMovers({
            gainers: (data.gainers || []).slice(0, 5).map((s: any) => ({
              symbol: s.symbol,
              price: s.price,
              change: +(s.changePercent ?? s.change ?? 0).toFixed(2),
            })),
            losers: (data.losers || []).slice(0, 5).map((s: any) => ({
              symbol: s.symbol,
              price: s.price,
              change: +(s.changePercent ?? s.change ?? 0).toFixed(2),
            })),
          });
          setIsLive(true);
        }
      }

      setLastUpdated(new Date());
    } catch {
      // Keep demo data on failure
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    // Auto-refresh every 60s if market is open
    const interval = setInterval(() => {
      if (isMarketOpen()) fetchLiveData();
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Market overview and portfolio summary
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLive && (
            <button
              onClick={fetchLiveData}
              disabled={refreshing}
              className="p-1.5 rounded-md hover:bg-white/5 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-[var(--text-muted)]", refreshing && "animate-spin")} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                marketOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              )}
            />
            <span className="text-sm text-[var(--text-secondary)]">
              NSE {marketOpen ? "Open" : "Closed"}
            </span>
          </div>
          {isLive && (
            <span className="text-[10px] text-emerald-400/70 uppercase tracking-wide font-medium">
              Live
            </span>
          )}
        </div>
      </div>

      {/* Index Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((index, i) => (
          <motion.div
            key={index.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard hover className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm text-[var(--text-secondary)]">{index.name}</span>
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    getChangeBg(index.change)
                  )}
                >
                  {formatPercent(index.change)}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-semibold font-mono-numbers">
                  {formatCurrency(index.value).replace("\u20B9", "")}
                </span>
                <MiniSparkline data={index.data} />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/ai-analysis">
          <GlassCard hover className="p-5 cursor-pointer group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Brain className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-medium">AI Analysis</h3>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] ml-auto group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Get AI-powered stock analysis with price targets and risk scoring
            </p>
          </GlassCard>
        </Link>
        <Link href="/dashboard/portfolio">
          <GlassCard hover className="p-5 cursor-pointer group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Briefcase className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-medium">Portfolio</h3>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] ml-auto group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              View your holdings, P&L, and portfolio allocation
            </p>
          </GlassCard>
        </Link>
        <Link href="/dashboard/market">
          <GlassCard hover className="p-5 cursor-pointer group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gold-500/10">
                <BarChart3 className="w-5 h-5 text-gold-500" />
              </div>
              <h3 className="font-medium">Market</h3>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] ml-auto group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Track indices, sectors, and market movers in real-time
            </p>
          </GlassCard>
        </Link>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gainers */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-medium">Top Gainers</h3>
          </div>
          <div className="space-y-2">
            {movers.gainers.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/dashboard/ai-analysis`}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-medium">{stock.symbol}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono-numbers">
                    {formatCurrency(stock.price)}
                  </span>
                  <span className="text-xs text-emerald-400 font-mono-numbers">
                    {formatPercent(stock.change)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>

        {/* Losers */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-medium">Top Losers</h3>
          </div>
          <div className="space-y-2">
            {movers.losers.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/dashboard/ai-analysis`}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-medium">{stock.symbol}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono-numbers">
                    {formatCurrency(stock.price)}
                  </span>
                  <span className="text-xs text-rose-400 font-mono-numbers">
                    {formatPercent(stock.change)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-[10px] text-[var(--text-muted)] text-right">
          Last updated: {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
