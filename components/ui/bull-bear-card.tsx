"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { GlassCard } from "./glass-card";

interface BullBearCardProps {
  strengths: string[];
  weaknesses: string[];
  className?: string;
}

export function BullBearCard({ strengths, weaknesses, className }: BullBearCardProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* Bull Case */}
      <GlassCard className="border-emerald-500/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-sm font-semibold text-emerald-400">Bull Case</h4>
        </div>
        <ul className="space-y-2">
          {strengths.map((s, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
            >
              <span className="text-emerald-400 mt-0.5 shrink-0">+</span>
              <span>{s}</span>
            </motion.li>
          ))}
        </ul>
      </GlassCard>

      {/* Bear Case */}
      <GlassCard className="border-rose-500/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-rose-500/10">
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <h4 className="text-sm font-semibold text-rose-400">Bear Case</h4>
        </div>
        <ul className="space-y-2">
          {weaknesses.map((w, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
            >
              <span className="text-rose-400 mt-0.5 shrink-0">-</span>
              <span>{w}</span>
            </motion.li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
