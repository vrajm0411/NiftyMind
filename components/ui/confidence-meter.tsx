"use client";

import { motion } from "framer-motion";

interface ConfidenceMeterProps {
  confidence: number; // 0-100
  size?: number;
  className?: string;
}

function getColor(value: number): string {
  if (value >= 70) return "#8b5cf6"; // violet
  if (value >= 50) return "#f59e0b"; // amber
  return "#f43f5e"; // rose
}

export function ConfidenceMeter({
  confidence,
  size = 110,
  className,
}: ConfidenceMeterProps) {
  const color = getColor(confidence);
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-2xl font-bold font-mono-numbers"
            style={{ color }}
          >
            {confidence}%
          </motion.span>
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-1.5">Confidence</p>
    </div>
  );
}
