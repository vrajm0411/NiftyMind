"use client";

import { cn, formatCurrency } from "@/lib/utils";

export interface PricePerformanceData {
  symbol: string;
  cmp: number;
  periods: {
    "5D": { price: number | null; change: number | null; changePct: number | null };
    "1M": { price: number | null; change: number | null; changePct: number | null };
    "3M": { price: number | null; change: number | null; changePct: number | null };
    "6M": { price: number | null; change: number | null; changePct: number | null };
    "1Y": { price: number | null; change: number | null; changePct: number | null };
  };
}

function ChangeCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[var(--text-muted)]">N/A</span>;
  const isPositive = value > 0;
  const isZero = value === 0;
  return (
    <span
      className={cn(
        "font-mono-numbers text-xs font-medium",
        isPositive ? "text-emerald-400" : isZero ? "text-[var(--text-secondary)]" : "text-rose-400"
      )}
    >
      {isPositive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export function PricePerformance({ data }: { data: PricePerformanceData }) {
  return (
    <div className="space-y-4">
      {/* CMP Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">
            Current Market Price
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-numbers">
              {formatCurrency(data.cmp)}
            </span>
          </div>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{data.symbol}</span>
      </div>

      {/* Period Performance: 5D, 1M, 3M, 6M, 1Y */}
      <div>
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-2">
          Performance
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {(["5D", "1M", "3M", "6M", "1Y"] as const).map((period) => {
            const d = data.periods[period];
            return (
              <div
                key={period}
                className="rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] p-2 text-center"
              >
                <div className="text-[10px] text-[var(--text-muted)] mb-1 font-medium">
                  {period}
                </div>
                {d.price !== null ? (
                  <>
                    <div className="text-[10px] font-mono-numbers text-[var(--text-secondary)] mb-0.5">
                      {formatCurrency(d.price)}
                    </div>
                    <ChangeCell value={d.changePct} />
                  </>
                ) : (
                  <div className="text-xs text-[var(--text-muted)]">N/A</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
