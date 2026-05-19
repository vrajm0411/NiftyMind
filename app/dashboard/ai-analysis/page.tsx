"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Brain, Loader2, RefreshCw } from "lucide-react";
import { StockSearch } from "@/components/ui/stock-search";
import { StreamingReport } from "@/components/ui/streaming-report";
import { VerdictBadge } from "@/components/ui/verdict-badge";
import { PriceTargetCard } from "@/components/ui/price-target-card";
import { RiskMeter } from "@/components/ui/risk-meter";
import { HealthScoreRing } from "@/components/ui/health-score-ring";
import { BullBearCard } from "@/components/ui/bull-bear-card";
import { CrisisTable, type CrisisRow } from "@/components/ui/crisis-table";
import { PricePerformance, type PricePerformanceData } from "@/components/ui/price-performance";
import { CRISIS_HISTORICAL_EVENTS } from "@/lib/ai/crisis-data";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { useAnalysis } from "@/hooks/use-analysis";
import { useStockStore } from "@/hooks/use-stock";
import { QUICK_PICKS } from "@/lib/upstox/instruments";
import { cn } from "@/lib/utils";

interface StockCrisisPrice {
  eventDate: string;
  dayBeforePrice: number | null;
  crashDayPrice: number | null;
  change3M: number | null;
  change6M: number | null;
  change1Y: number | null;
}

export default function AIAnalysisPage() {
  const { selectedStock, setSelectedStock } = useStockStore();
  const [symbol, setSymbol] = useState(selectedStock || "");
  const [stockCrisisPrices, setStockCrisisPrices] = useState<StockCrisisPrice[]>([]);
  const [crisisLoading, setCrisisLoading] = useState(false);
  const [pricePerf, setPricePerf] = useState<PricePerformanceData | null>(null);
  const [pricePerfLoading, setPricePerfLoading] = useState(false);
  const analysis = useAnalysis();

  // Fetch price performance data (CMP, 5-day, 1M/3M/6M/1Y)
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

  // Fetch stock-specific crisis prices when analysis is triggered
  const fetchStockCrisis = useCallback(async (sym: string) => {
    setStockCrisisPrices([]); // clear stale data from previous stock
    setCrisisLoading(true);
    try {
      const res = await fetch(`/api/market/crisis-prices?symbol=${encodeURIComponent(sym)}`);
      if (res.ok) {
        const json = await res.json();
        setStockCrisisPrices(json.data || []);
      }
    } catch {
      // silently fail — table falls back to Nifty-only
    } finally {
      setCrisisLoading(false);
    }
  }, []);

  const handleAnalyze = () => {
    if (!symbol) return;
    setSelectedStock(symbol);
    analysis.analyze(symbol);
    fetchStockCrisis(symbol);
    fetchPricePerformance(symbol);
  };

  const handleSelectStock = (s: string) => {
    setSymbol(s);
    setSelectedStock(s);
  };

  const result = analysis.result;
  const isActive = analysis.status !== "idle";

  // Build crisis table: merge Nifty data + stock-specific data (matched by date)
  const crisisRows: CrisisRow[] = CRISIS_HISTORICAL_EVENTS.map((e) => {
    const stockData = stockCrisisPrices.find((s) => s.eventDate === e.date);
    return {
      event: e.name,
      date: e.date,
      dayBeforePrice: e.dayBeforePrice,
      change3M: e.change3M,
      change6M: e.change6M,
      change1Y: e.change1Y,
      description: e.description,
      stockDayBefore: stockData?.dayBeforePrice ?? null,
      stockCrashDay: stockData?.crashDayPrice ?? null,
      stockChange3M: stockData?.change3M ?? null,
      stockChange6M: stockData?.change6M ?? null,
      stockChange1Y: stockData?.change1Y ?? null,
    };
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Brain className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">AI Analysis</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            AI-powered stock analysis with crisis resilience scoring
          </p>
        </div>
      </div>

      {/* Search + Analyze */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row gap-3">
          <StockSearch
            onSelect={handleSelectStock}
            className="flex-1"
          />
          <button
            onClick={handleAnalyze}
            disabled={!symbol || analysis.status === "loading" || analysis.status === "streaming"}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap",
              symbol && analysis.status !== "loading" && analysis.status !== "streaming"
                ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                : "bg-white/5 text-[var(--text-muted)] cursor-not-allowed"
            )}
          >
            {analysis.status === "loading" || analysis.status === "streaming" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            {analysis.status === "loading"
              ? "Analyzing..."
              : analysis.status === "streaming"
              ? "Generating..."
              : "Generate Analysis"}
          </button>
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
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Status Message */}
      {analysis.status === "loading" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-cyan-400"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          {analysis.statusMessage}
        </motion.div>
      )}

      {/* Error */}
      {analysis.status === "error" && (
        <GlassCard className="border-rose-500/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-rose-400">{analysis.error}</p>
            <button
              onClick={handleAnalyze}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </GlassCard>
      )}

      {/* Results */}
      {isActive && analysis.status !== "error" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left panel - Streaming Report */}
          <div className="lg:col-span-3 space-y-6">
            <StreamingReport
              content={analysis.reportContent}
              isStreaming={analysis.status === "streaming"}
              className="min-h-[300px] max-h-[500px]"
            />

            {/* Bull/Bear Card */}
            {result?.strengths && result?.weaknesses && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <BullBearCard
                  strengths={result.strengths}
                  weaknesses={result.weaknesses}
                />
              </motion.div>
            )}

            {/* Crisis Resilience Table — always visible with historical Nifty data */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                    Crisis Resilience Analysis
                  </h3>
                  {crisisLoading && (
                    <span className="text-xs text-cyan-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading {symbol}...
                    </span>
                  )}
                </div>
                <CrisisTable data={crisisRows} symbol={symbol || undefined} />
              </GlassCard>
            </motion.div>
          </div>

          {/* Right panel - Metrics */}
          <div className="lg:col-span-2 space-y-4">
            {/* Price Performance (CMP + 5-day + 1M/3M/6M/1Y) */}
            {pricePerfLoading ? (
              <Skeleton variant="card" className="h-52" />
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

            {/* Health Score */}
            {(result?.healthScore !== undefined || analysis.partialData.healthScore !== undefined) ? (
              <GlassCard className="flex justify-center py-6">
                <HealthScoreRing
                  score={result?.healthScore ?? analysis.partialData.healthScore ?? 0}
                />
              </GlassCard>
            ) : analysis.status === "streaming" ? (
              <Skeleton variant="card" className="h-44" />
            ) : null}

            {/* Verdict Badge */}
            {(result?.recommendation || analysis.partialData.recommendation) && (
              <GlassCard className="flex flex-col items-center py-4">
                <p className="text-xs text-[var(--text-muted)] mb-2">Recommendation</p>
                <VerdictBadge
                  verdict={(result?.recommendation ?? analysis.partialData.recommendation)!}
                  confidence={result?.confidence ?? analysis.partialData.confidence}
                  size="lg"
                />
              </GlassCard>
            )}

            {/* Price Targets */}
            {result?.priceTarget && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <PriceTargetCard
                  current={result.priceTarget.current}
                  bear={result.priceTarget.bear}
                  base={result.priceTarget.base}
                  bull={result.priceTarget.bull}
                  timeframe={result.priceTarget.timeframe}
                />
              </motion.div>
            )}

            {/* Risk Meters */}
            {result?.risk && result?.fundamental && result?.technical && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard>
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                    Score Breakdown
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <RiskMeter label="Fundamental" value={result.fundamental.score} size="sm" />
                    <RiskMeter label="Technical" value={result.technical.score} size="sm" />
                    <RiskMeter label="Risk" value={result.risk.score} size="sm" />
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Technical Signals */}
            {result?.technical?.signals && (
              <GlassCard>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Technical Signals
                </h3>
                <div className="space-y-2">
                  {result.technical.signals.map((signal, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {signal}
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Trend</span>
                    <span className={cn(
                      "font-medium",
                      result.technical.trend === "bullish" ? "text-emerald-400" :
                      result.technical.trend === "bearish" ? "text-rose-400" : "text-amber-400"
                    )}>
                      {result.technical.trend.charAt(0).toUpperCase() + result.technical.trend.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">RSI</span>
                    <span className="font-mono-numbers">{result.technical.rsi}</span>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Outlook */}
            {result?.outlook && (
              <GlassCard>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Outlook
                </h3>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                  {result.outlook}
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {analysis.status === "idle" && (
        <GlassCard className="text-center py-16">
          <Brain className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Ready for Analysis</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            Search for any NSE stock above and click &quot;Generate Analysis&quot; to get
            an AI-powered comprehensive report with price targets, risk scoring,
            and crisis resilience analysis.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
