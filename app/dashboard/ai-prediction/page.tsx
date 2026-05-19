"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { StockSearch } from "@/components/ui/stock-search";
import { GlassCard } from "@/components/ui/glass-card";
import { HorizonSelector } from "@/components/ui/horizon-selector";
import { PredictionResultView } from "@/components/ui/prediction-result";
import { PricePerformance, type PricePerformanceData } from "@/components/ui/price-performance";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { usePrediction } from "@/hooks/use-prediction";
import { useStockStore } from "@/hooks/use-stock";
import { QUICK_PICKS } from "@/lib/upstox/instruments";
import { cn } from "@/lib/utils";
import type { Horizon } from "@/lib/ai/prediction-types";

export default function AIPredictionPage() {
  const { selectedStock, setSelectedStock } = useStockStore();
  const [symbol, setSymbol] = useState(selectedStock || "");
  const [horizon, setHorizon] = useState<Horizon>("Short-term (1–7 days)");
  const [pricePerf, setPricePerf] = useState<PricePerformanceData | null>(null);
  const [pricePerfLoading, setPricePerfLoading] = useState(false);
  const prediction = usePrediction();

  const fetchPricePerformance = useCallback(async (sym: string) => {
    setPricePerf(null);
    setPricePerfLoading(true);
    try {
      const res = await fetch(`/api/market/performance?symbol=${encodeURIComponent(sym)}`);
      if (res.ok) {
        const data = await res.json();
        setPricePerf(data);
      }
    } catch {
      // silently fail
    } finally {
      setPricePerfLoading(false);
    }
  }, []);

  const handleGenerate = () => {
    if (!symbol) return;
    setSelectedStock(symbol);
    prediction.predict(symbol, horizon);
    fetchPricePerformance(symbol);
  };

  const handleSelectStock = (s: string) => {
    setSymbol(s);
    setSelectedStock(s);
  };

  const isLoading = prediction.status === "loading" || prediction.status === "streaming";
  const isActive = prediction.status !== "idle";
  const currentPrice = pricePerf?.cmp || undefined;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-violet-500/10">
          <Sparkles className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">AI Prediction</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            AI-powered directional forecast with price targets and risk assessment
          </p>
        </div>
      </div>

      {/* Search + Horizon + Generate */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row gap-3">
          <StockSearch
            onSelect={handleSelectStock}
            className="flex-1"
          />
          <button
            onClick={handleGenerate}
            disabled={!symbol || isLoading}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap",
              symbol && !isLoading
                ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                : "bg-white/5 text-[var(--text-muted)] cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {prediction.status === "loading"
              ? "Computing..."
              : prediction.status === "streaming"
              ? "Predicting..."
              : "Generate Prediction"}
          </button>
        </div>

        {/* Horizon selector */}
        <div className="mt-3">
          <HorizonSelector
            value={horizon}
            onChange={setHorizon}
            disabled={isLoading}
          />
        </div>

        {/* Quick picks */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {QUICK_PICKS.slice(0, 8).map((s) => (
            <button
              key={s}
              onClick={() => handleSelectStock(s)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs transition-colors",
                symbol === s
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Status Message */}
      {prediction.status === "loading" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-violet-400"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          {prediction.statusMessage}
        </motion.div>
      )}

      {/* Error */}
      {prediction.status === "error" && (
        <GlassCard className="border-rose-500/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-rose-400">{prediction.error}</p>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </GlassCard>
      )}

      {/* Price Performance bar (shared context) */}
      {isActive && prediction.status !== "error" && (
        <>
          {pricePerfLoading ? (
            <Skeleton variant="card" className="h-20" />
          ) : pricePerf ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard>
                <PricePerformance data={pricePerf} />
              </GlassCard>
            </motion.div>
          ) : null}
        </>
      )}

      {/* Prediction Results */}
      {isActive && prediction.status !== "error" && (
        <PredictionResultView
          result={prediction.result}
          partialData={prediction.partialData}
          isStreaming={prediction.status === "streaming"}
          isLoading={prediction.status === "loading"}
          currentPrice={currentPrice}
        />
      )}

      {/* Empty state */}
      {prediction.status === "idle" && (
        <GlassCard className="text-center py-16">
          <Sparkles className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Ready for Prediction</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            Select a stock, choose your forecast horizon, and click &quot;Generate Prediction&quot;
            to get an AI-powered directional forecast with price targets, confidence scoring,
            and risk assessment.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
