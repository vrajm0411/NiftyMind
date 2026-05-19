"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { GlassCard } from "./glass-card";

interface PriceTargetCardProps {
  current: number;
  bear: number;
  base: number;
  bull: number;
  timeframe?: string;
  className?: string;
}

export function PriceTargetCard({
  current,
  bear,
  base,
  bull,
  timeframe = "12 months",
  className,
}: PriceTargetCardProps) {
  const min = Math.min(bear, current) * 0.95;
  const max = bull * 1.05;
  const range = max - min;
  const getPosition = (v: number) => ((v - min) / range) * 100;

  return (
    <GlassCard className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
          Price Targets
        </h3>
        <span className="text-[10px] text-[var(--text-muted)]">{timeframe}</span>
      </div>

      {/* Price bar */}
      <div className="relative h-3 bg-white/5 rounded-full mb-6 mx-2">
        {/* Bear zone */}
        <div
          className="absolute top-0 h-full rounded-l-full bg-rose-500/30"
          style={{ left: 0, width: `${getPosition(bear)}%` }}
        />
        {/* Base zone */}
        <div
          className="absolute top-0 h-full bg-amber-500/30"
          style={{ left: `${getPosition(bear)}%`, width: `${getPosition(base) - getPosition(bear)}%` }}
        />
        {/* Bull zone */}
        <div
          className="absolute top-0 h-full rounded-r-full bg-emerald-500/30"
          style={{ left: `${getPosition(base)}%`, width: `${getPosition(bull) - getPosition(base)}%` }}
        />

        {/* Current price marker */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 border-2 border-navy-900 shadow-[0_0_10px_rgba(0,212,255,0.5)]"
          style={{ left: `${getPosition(current)}%`, marginLeft: "-8px" }}
        />
      </div>

      {/* Labels */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-rose-400 uppercase tracking-wider mb-0.5">Bear</p>
          <p className="text-sm font-mono-numbers font-semibold text-[var(--text-primary)]">
            {formatCurrency(bear)}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">
            {(((bear - current) / current) * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-0.5">Base</p>
          <p className="text-sm font-mono-numbers font-semibold text-[var(--text-primary)]">
            {formatCurrency(base)}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">
            {(((base - current) / current) * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-0.5">Bull</p>
          <p className="text-sm font-mono-numbers font-semibold text-[var(--text-primary)]">
            {formatCurrency(bull)}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">
            +{(((bull - current) / current) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="text-center mt-3 pt-3 border-t border-[var(--border-subtle)]">
        <p className="text-[10px] text-[var(--text-muted)]">Current</p>
        <p className="text-lg font-mono-numbers font-bold text-cyan-400">
          {formatCurrency(current)}
        </p>
      </div>
    </GlassCard>
  );
}
