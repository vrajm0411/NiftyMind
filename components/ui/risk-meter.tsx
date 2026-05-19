"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RiskMeterProps {
  label: string;
  value: number; // 0-100
  size?: "sm" | "md";
  className?: string;
}

function getColor(value: number): string {
  if (value <= 30) return "#10b981"; // green
  if (value <= 60) return "#f59e0b"; // gold
  if (value <= 80) return "#f97316"; // orange
  return "#f43f5e"; // red
}

function getLabel(value: number): string {
  if (value <= 20) return "Very Low";
  if (value <= 40) return "Low";
  if (value <= 60) return "Moderate";
  if (value <= 80) return "High";
  return "Very High";
}

export function RiskMeter({ label, value, size = "md", className }: RiskMeterProps) {
  const color = getColor(value);
  const riskLabel = getLabel(value);
  const dims = size === "sm" ? { w: 100, h: 60, r: 40, sw: 8 } : { w: 140, h: 80, r: 55, sw: 10 };
  const circumference = Math.PI * dims.r;
  const progress = (value / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg width={dims.w} height={dims.h} viewBox={`0 0 ${dims.w} ${dims.h + 5}`}>
        {/* Background arc */}
        <path
          d={`M ${dims.sw / 2} ${dims.h} A ${dims.r} ${dims.r} 0 0 1 ${dims.w - dims.sw / 2} ${dims.h}`}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={dims.sw}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <motion.path
          d={`M ${dims.sw / 2} ${dims.h} A ${dims.r} ${dims.r} 0 0 1 ${dims.w - dims.sw / 2} ${dims.h}`}
          fill="none"
          stroke={color}
          strokeWidth={dims.sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {/* Value text */}
        <text
          x={dims.w / 2}
          y={dims.h - 8}
          textAnchor="middle"
          className="fill-[var(--text-primary)] font-mono-numbers"
          fontSize={size === "sm" ? 16 : 20}
          fontWeight={600}
        >
          {value}
        </text>
      </svg>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{label}</p>
      <p className="text-[10px] font-medium" style={{ color }}>
        {riskLabel}
      </p>
    </div>
  );
}
