"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";
import { GlassCard } from "./glass-card";
import { DirectionBadge } from "./direction-badge";
import { ConfidenceMeter } from "./confidence-meter";
import { PriceForecastCard } from "./price-forecast-card";
import { PredictionSignals } from "./prediction-signals";
import { Skeleton } from "./loading-skeleton";
import type { PredictionResult as PredictionResultType } from "@/lib/ai/prediction-types";

interface PredictionResultProps {
  result: PredictionResultType | null;
  partialData: Partial<PredictionResultType>;
  isStreaming: boolean;
  isLoading: boolean;
  currentPrice?: number;
}

const RISK_COLORS: Record<string, string> = {
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  High: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  Extreme: "text-red-400 bg-red-500/10 border-red-500/20",
};

export function PredictionResultView({
  result,
  partialData,
  isStreaming,
  isLoading,
  currentPrice,
}: PredictionResultProps) {
  const direction = result?.direction || partialData.direction;
  const confidence = result?.confidence ?? partialData.confidence;
  const forecast = result?.price_forecast || partialData.price_forecast;
  const risk = result?.risk || partialData.risk;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left panel — Summary, Reasoning, Signals, Disclaimer */}
      <div className="lg:col-span-3 space-y-4">
        {/* Plain summary */}
        {result?.plain_summary ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                Summary
              </h3>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                {result.plain_summary}
              </p>
            </GlassCard>
          </motion.div>
        ) : (isStreaming || isLoading) ? (
          <Skeleton variant="card" className="h-24" />
        ) : null}

        {/* Reasoning */}
        {result?.reasoning ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                Reasoning
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cyan-400 mb-1 font-semibold">
                    Technical
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {result.reasoning.technical}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-violet-400 mb-1 font-semibold">
                    Sentiment
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {result.reasoning.sentiment}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-400 mb-1 font-semibold">
                    Macro
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {result.reasoning.macro}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ) : (isStreaming || isLoading) ? (
          <Skeleton variant="card" className="h-40" />
        ) : null}

        {/* Signals */}
        {result?.signals ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <PredictionSignals
              bullish={result.signals.bullish}
              bearish={result.signals.bearish}
            />
          </motion.div>
        ) : (isStreaming || isLoading) ? (
          <Skeleton variant="card" className="h-32" />
        ) : null}

        {/* Disclaimer */}
        {result?.disclaimer && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <Info className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {result.disclaimer}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Right panel — Direction, Confidence, Price Forecast, Risk */}
      <div className="lg:col-span-2 space-y-4">
        {/* Direction Badge */}
        {direction ? (
          <GlassCard className="flex justify-center py-5">
            <DirectionBadge direction={direction} size="lg" />
          </GlassCard>
        ) : (isStreaming || isLoading) ? (
          <Skeleton variant="card" className="h-20" />
        ) : null}

        {/* Confidence */}
        {confidence !== undefined ? (
          <GlassCard className="flex justify-center py-4">
            <ConfidenceMeter confidence={confidence} />
          </GlassCard>
        ) : (isStreaming || isLoading) ? (
          <Skeleton variant="card" className="h-36" />
        ) : null}

        {/* Price Forecast */}
        {forecast ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <PriceForecastCard
              low={forecast.low}
              base={forecast.base}
              high={forecast.high}
              currentPrice={currentPrice}
            />
          </motion.div>
        ) : (isStreaming || isLoading) ? (
          <Skeleton variant="card" className="h-44" />
        ) : null}

        {/* Risk */}
        {risk ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                Risk Assessment
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[var(--text-muted)]" />
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                    RISK_COLORS[risk.level] || RISK_COLORS.Medium
                  }`}
                >
                  {risk.level}
                </span>
              </div>
              {result?.risk?.drivers && result.risk.drivers.length > 0 && (
                <div className="space-y-1.5">
                  {result.risk.drivers.map((driver, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                    >
                      <div className="w-1 h-1 rounded-full bg-[var(--text-muted)] mt-1.5 shrink-0" />
                      <span>{driver}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        ) : (isStreaming || isLoading) ? (
          <Skeleton variant="card" className="h-28" />
        ) : null}
      </div>
    </div>
  );
}
