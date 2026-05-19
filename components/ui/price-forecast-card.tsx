"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { GlassCard } from "./glass-card";

interface PriceForecastCardProps {
  low: number;
  base: number;
  high: number;
  currentPrice?: number;
  currency?: "INR" | "USD";
  className?: string;
}

export function PriceForecastCard({
  low,
  base,
  high,
  currentPrice,
  className,
}: PriceForecastCardProps) {
  const min = Math.min(low, currentPrice || low) * 0.98;
  const max = high * 1.02;
  const range = max - min;
  const getPos = (v: number) => Math.max(0, Math.min(100, ((v - min) / range) * 100));

  return (
    <GlassCard className={className}>
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
        Price Forecast
      </h3>

      {/* Price bar */}
      <div className="relative h-3 bg-white/5 rounded-full mb-6 mx-2">
        {/* Low zone */}
        <div
          className="absolute top-0 h-full rounded-l-full bg-rose-500/30"
          style={{ left: 0, width: `${getPos(low)}%` }}
        />
        {/* Base zone */}
        <div
          className="absolute top-0 h-full bg-violet-500/30"
          style={{ left: `${getPos(low)}%`, width: `${getPos(base) - getPos(low)}%` }}
        />
        {/* High zone */}
        <div
          className="absolute top-0 h-full rounded-r-full bg-emerald-500/30"
          style={{ left: `${getPos(base)}%`, width: `${getPos(high) - getPos(base)}%` }}
        />

        {/* Current price marker */}
        {currentPrice && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 border-2 border-[var(--bg-glass)] shadow-[0_0_10px_rgba(0,212,255,0.5)]"
            style={{ left: `${getPos(currentPrice)}%`, marginLeft: "-8px" }}
          />
        )}
      </div>

      {/* Labels */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-rose-400 uppercase tracking-wider mb-0.5">Low</p>
          <p className="text-sm font-mono-numbers font-semibold text-[var(--text-primary)]">
            {formatCurrency(low)}
          </p>
          {currentPrice && (
            <p className="text-[10px] text-[var(--text-muted)]">
              {(((low - currentPrice) / currentPrice) * 100).toFixed(1)}%
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] text-violet-400 uppercase tracking-wider mb-0.5">Base</p>
          <p className="text-sm font-mono-numbers font-semibold text-[var(--text-primary)]">
            {formatCurrency(base)}
          </p>
          {currentPrice && (
            <p className="text-[10px] text-[var(--text-muted)]">
              {(((base - currentPrice) / currentPrice) * 100) > 0 ? "+" : ""}
              {(((base - currentPrice) / currentPrice) * 100).toFixed(1)}%
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-0.5">High</p>
          <p className="text-sm font-mono-numbers font-semibold text-[var(--text-primary)]">
            {formatCurrency(high)}
          </p>
          {currentPrice && (
            <p className="text-[10px] text-[var(--text-muted)]">
              +{(((high - currentPrice) / currentPrice) * 100).toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      {currentPrice && (
        <div className="text-center mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <p className="text-[10px] text-[var(--text-muted)]">Current</p>
          <p className="text-lg font-mono-numbers font-bold text-cyan-400">
            {formatCurrency(currentPrice)}
          </p>
        </div>
      )}
    </GlassCard>
  );
}
