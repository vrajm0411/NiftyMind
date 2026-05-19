"use client";

import { motion } from "framer-motion";

interface HealthScoreRingProps {
  score: number; // 0-100
  size?: number;
  label?: string;
  className?: string;
}

function getColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 50) return "#f59e0b";
  if (score >= 30) return "#f97316";
  return "#f43f5e";
}

export function HealthScoreRing({
  score,
  size = 120,
  label = "Health Score",
  className,
}: HealthScoreRingProps) {
  const color = getColor(score);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-2xl font-bold font-mono-numbers"
            style={{ color }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] text-[var(--text-muted)]">/ 100</span>
        </div>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mt-2">{label}</p>
    </div>
  );
}
