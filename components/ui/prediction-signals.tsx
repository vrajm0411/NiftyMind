"use client";

import { motion } from "framer-motion";
import { GlassCard } from "./glass-card";

interface PredictionSignalsProps {
  bullish: string[];
  bearish: string[];
  className?: string;
}

export function PredictionSignals({
  bullish,
  bearish,
  className,
}: PredictionSignalsProps) {
  return (
    <GlassCard className={className}>
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
        Signals
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Bullish signals */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-emerald-400 mb-2 font-semibold">
            Bullish
          </p>
          <div className="space-y-1.5">
            {bullish.map((signal, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                <span>{signal}</span>
              </motion.div>
            ))}
            {bullish.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] italic">None detected</p>
            )}
          </div>
        </div>

        {/* Bearish signals */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-rose-400 mb-2 font-semibold">
            Bearish
          </p>
          <div className="space-y-1.5">
            {bearish.map((signal, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0" />
                <span>{signal}</span>
              </motion.div>
            ))}
            {bearish.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] italic">None detected</p>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
