"use client";

import { cn } from "@/lib/utils";
import type { Horizon } from "@/lib/ai/prediction-types";

interface HorizonSelectorProps {
  value: Horizon;
  onChange: (horizon: Horizon) => void;
  disabled?: boolean;
  className?: string;
}

const HORIZONS: { label: string; value: Horizon }[] = [
  { label: "Intraday", value: "Intraday" },
  { label: "Short-term", value: "Short-term (1–7 days)" },
  { label: "Medium-term", value: "Medium-term (1–4 weeks)" },
];

export function HorizonSelector({
  value,
  onChange,
  disabled,
  className,
}: HorizonSelectorProps) {
  return (
    <div className={cn("flex gap-1.5 p-1 bg-white/5 rounded-lg", className)}>
      {HORIZONS.map((h) => (
        <button
          key={h.value}
          onClick={() => onChange(h.value)}
          disabled={disabled}
          className={cn(
            "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            value === h.value
              ? "bg-violet-500/20 text-violet-400 border border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.15)]"
              : "text-[var(--text-secondary)] hover:bg-white/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {h.label}
        </button>
      ))}
    </div>
  );
}
