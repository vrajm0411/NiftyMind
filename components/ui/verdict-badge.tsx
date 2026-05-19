"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Verdict = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";

interface VerdictBadgeProps {
  verdict: Verdict;
  confidence?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const verdictConfig: Record<Verdict, { label: string; gradient: string; border: string }> = {
  STRONG_BUY: {
    label: "Strong Buy",
    gradient: "from-emerald-500 to-emerald-600",
    border: "border-emerald-500/40",
  },
  BUY: {
    label: "Buy",
    gradient: "from-emerald-400 to-teal-500",
    border: "border-emerald-400/40",
  },
  HOLD: {
    label: "Hold",
    gradient: "from-amber-400 to-amber-500",
    border: "border-amber-400/40",
  },
  SELL: {
    label: "Sell",
    gradient: "from-rose-400 to-rose-500",
    border: "border-rose-400/40",
  },
  STRONG_SELL: {
    label: "Strong Sell",
    gradient: "from-rose-500 to-red-600",
    border: "border-rose-500/40",
  },
};

const sizeClasses = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-1.5 text-sm",
  lg: "px-6 py-2.5 text-base",
};

export function VerdictBadge({
  verdict,
  confidence,
  size = "md",
  className,
}: VerdictBadgeProps) {
  const config = verdictConfig[verdict];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("inline-flex flex-col items-center gap-1", className)}
    >
      <motion.span
        animate={{
          boxShadow: [
            "0 0 10px rgba(0,212,255,0.1)",
            "0 0 20px rgba(0,212,255,0.2)",
            "0 0 10px rgba(0,212,255,0.1)",
          ],
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className={cn(
          "inline-flex items-center rounded-full font-bold tracking-wide bg-gradient-to-r text-white border",
          config.gradient,
          config.border,
          sizeClasses[size]
        )}
      >
        {config.label}
      </motion.span>
      {confidence !== undefined && (
        <span className="text-[10px] text-[var(--text-muted)]">
          {confidence}% confidence
        </span>
      )}
    </motion.div>
  );
}
