"use client";

import { useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn, formatCurrency, formatPercent, getChangeBg } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  format?: "currency" | "percent" | "number";
  change?: number;
  suffix?: string;
  compact?: boolean;
  className?: string;
}

function AnimatedNumber({
  value,
  format = "number",
  compact = false,
}: {
  value: number;
  format: string;
  compact: boolean;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => {
    if (format === "currency") return formatCurrency(v, compact);
    if (format === "percent") return formatPercent(v);
    return v.toFixed(2);
  });
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1,
      ease: "easeOut",
    });
    return controls.stop;
  }, [count, value]);

  useEffect(() => {
    return rounded.on("change", (v) => {
      if (nodeRef.current) nodeRef.current.textContent = v;
    });
  }, [rounded]);

  return <span ref={nodeRef} className="font-mono-numbers" />;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  format = "number",
  change,
  suffix,
  compact = false,
  className,
}: MetricCardProps) {
  return (
    <GlassCard hover className={className}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        {change !== undefined && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              getChangeBg(change)
            )}
          >
            {formatPercent(change)}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold mb-1">
        <AnimatedNumber value={value} format={format} compact={compact} />
        {suffix && (
          <span className="text-sm text-[var(--text-secondary)] ml-1">
            {suffix}
          </span>
        )}
      </div>
      <div className="text-sm text-[var(--text-secondary)]">{label}</div>
    </GlassCard>
  );
}
