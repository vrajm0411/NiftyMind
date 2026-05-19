"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DirectionBadgeProps {
  direction: "Bullish" | "Bearish" | "Neutral";
  size?: "sm" | "lg";
  className?: string;
}

const CONFIG = {
  Bullish: {
    gradient: "from-emerald-500 to-green-600",
    glow: "rgba(16,185,129,0.3)",
    icon: TrendingUp,
    text: "BULLISH",
  },
  Bearish: {
    gradient: "from-rose-500 to-red-600",
    glow: "rgba(244,63,94,0.3)",
    icon: TrendingDown,
    text: "BEARISH",
  },
  Neutral: {
    gradient: "from-amber-500 to-orange-500",
    glow: "rgba(245,158,11,0.3)",
    icon: Minus,
    text: "NEUTRAL",
  },
};

export function DirectionBadge({
  direction,
  size = "lg",
  className,
}: DirectionBadgeProps) {
  const config = CONFIG[direction];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl font-bold tracking-wider",
        `bg-gradient-to-r ${config.gradient} text-white`,
        size === "lg" ? "px-5 py-2.5 text-sm" : "px-3 py-1.5 text-xs",
        className
      )}
      style={{ boxShadow: `0 0 20px ${config.glow}` }}
    >
      <Icon className={size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5"} />
      {config.text}
    </motion.div>
  );
}
