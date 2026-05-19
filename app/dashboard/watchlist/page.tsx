"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { StockSearch } from "@/components/ui/stock-search";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { useStockStore } from "@/hooks/use-stock";
import { cn, formatCurrency, formatPercent, getChangeColor } from "@/lib/utils";
import Link from "next/link";

// Demo data
const DEMO_PRICES: Record<string, { price: number; change: number; data: number[] }> = {
  RELIANCE: { price: 2520.75, change: 1.24, data: [2480, 2490, 2500, 2510, 2515, 2520, 2520] },
  TCS: { price: 3890.25, change: 2.14, data: [3800, 3820, 3840, 3860, 3880, 3885, 3890] },
  INFY: { price: 1485.50, change: -0.38, data: [1500, 1495, 1492, 1490, 1488, 1486, 1485] },
  HDFCBANK: { price: 1625.30, change: 0.92, data: [1610, 1612, 1615, 1618, 1620, 1623, 1625] },
  ICICIBANK: { price: 1045.80, change: 0.65, data: [1038, 1040, 1041, 1043, 1044, 1045, 1045] },
  SBIN: { price: 625.40, change: -1.12, data: [635, 633, 630, 628, 627, 626, 625] },
  TATAMOTORS: { price: 675.30, change: 3.18, data: [650, 655, 660, 665, 670, 673, 675] },
  ADANIENT: { price: 2850.75, change: 4.52, data: [2720, 2750, 2780, 2800, 2830, 2845, 2850] },
  BAJFINANCE: { price: 7420.50, change: 2.85, data: [7200, 7250, 7300, 7350, 7380, 7400, 7420] },
  ITC: { price: 435.20, change: 0.42, data: [432, 433, 433, 434, 434, 435, 435] },
};

export default function WatchlistPage() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useStockStore();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Watchlist</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {watchlist.length} stocks tracked
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Stock
        </button>
      </div>

      {/* Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard>
              <StockSearch
                onSelect={(s) => {
                  addToWatchlist(s);
                  setShowSearch(false);
                }}
              />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watchlist Grid */}
      {watchlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {watchlist.map((symbol, i) => {
              const stockData = DEMO_PRICES[symbol] || {
                price: 1000 + Math.random() * 2000,
                change: (Math.random() - 0.5) * 6,
                data: Array.from({ length: 7 }, () => 1000 + Math.random() * 100),
              };
              return (
                <motion.div
                  key={symbol}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassCard hover className="relative group">
                    {/* Remove button */}
                    <button
                      onClick={() => removeFromWatchlist(symbol)}
                      className="absolute top-3 right-3 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                    >
                      <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </button>

                    <Link href="/dashboard/ai-analysis" className="block">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{symbol}</h3>
                          <span className={cn("text-xs font-mono-numbers", getChangeColor(stockData.change))}>
                            {formatPercent(stockData.change)}
                          </span>
                        </div>
                        <MiniSparkline data={stockData.data} />
                      </div>
                      <div className="text-lg font-semibold font-mono-numbers">
                        {formatCurrency(stockData.price)}
                      </div>
                    </Link>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <GlassCard className="text-center py-16">
          <Star className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="font-medium mb-1">No stocks in watchlist</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Add stocks to track their prices and get quick access to analysis
          </p>
          <button
            onClick={() => setShowSearch(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add your first stock
          </button>
        </GlassCard>
      )}
    </div>
  );
}
