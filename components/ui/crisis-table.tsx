"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CrisisRow {
  event: string;
  date: string;
  dayBeforePrice: number;
  change3M: number | null;
  change6M: number | null;
  change1Y: number | null;
  description: string;
  // Stock-specific data (optional)
  stockDayBefore?: number | null;
  stockCrashDay?: number | null;
  stockChange3M?: number | null;
  stockChange6M?: number | null;
  stockChange1Y?: number | null;
}

interface CrisisTableProps {
  data: CrisisRow[];
  symbol?: string;
  className?: string;
}

function getChangeColor(val: number | null): string {
  if (val === null) return "text-[var(--text-muted)]";
  if (val > 0) return "text-emerald-400";
  if (val < -10) return "text-rose-400";
  if (val < 0) return "text-amber-400";
  return "text-[var(--text-secondary)]";
}

function formatChange(val: number | null): string {
  if (val === null) return "—";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "—";
  return `₹${price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function CrisisTable({ data, symbol, className }: CrisisTableProps) {
  const hasStockData = data.some((r) => r.stockDayBefore != null || r.stockCrashDay != null);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="text-left py-3 px-2 text-xs font-medium text-cyan-400 uppercase tracking-wider">
              Crisis Event
            </th>
            <th className="text-left py-3 px-2 text-xs font-medium text-cyan-400 uppercase tracking-wider">
              Date
            </th>
            {hasStockData && (
              <>
                <th className="text-right py-3 px-2 text-xs font-medium text-teal-400 uppercase tracking-wider whitespace-nowrap">
                  Day Before
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-rose-400 uppercase tracking-wider whitespace-nowrap">
                  Crash Day
                </th>
              </>
            )}
            <th className="text-right py-3 px-2 text-xs font-medium text-cyan-400/60 uppercase tracking-wider whitespace-nowrap">
              Nifty
            </th>
            <th className="text-right py-3 px-2 text-xs font-medium text-cyan-400 uppercase tracking-wider whitespace-nowrap">
              {hasStockData && symbol ? `${symbol} ` : ""}3M
            </th>
            <th className="text-right py-3 px-2 text-xs font-medium text-cyan-400 uppercase tracking-wider whitespace-nowrap">
              {hasStockData && symbol ? `${symbol} ` : ""}6M
            </th>
            <th className="text-right py-3 px-2 text-xs font-medium text-cyan-400 uppercase tracking-wider whitespace-nowrap">
              {hasStockData && symbol ? `${symbol} ` : ""}1Y
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const crashDrop = (row.stockDayBefore != null && row.stockCrashDay != null && row.stockDayBefore !== 0)
              ? +(((row.stockCrashDay - row.stockDayBefore) / row.stockDayBefore) * 100).toFixed(1)
              : null;

            return (
              <motion.tr
                key={row.event}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="border-b border-[var(--border-subtle)] hover:bg-white/[0.02] transition-colors group"
                title={row.description}
              >
                <td className="py-3 px-2 font-medium text-[var(--text-primary)] max-w-[140px]">
                  <span className="block truncate">{row.event}</span>
                </td>
                <td className="py-3 px-2 text-[var(--text-secondary)] whitespace-nowrap text-xs">
                  {row.date}
                </td>
                {hasStockData && (
                  <>
                    <td className="py-3 px-2 text-right font-mono text-teal-300 whitespace-nowrap">
                      {formatPrice(row.stockDayBefore)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono whitespace-nowrap">
                      <span className={cn(
                        row.stockCrashDay != null ? "text-rose-300" : "text-[var(--text-muted)]"
                      )}>
                        {formatPrice(row.stockCrashDay)}
                      </span>
                      {crashDrop !== null && (
                        <span className={cn("ml-1 text-[10px]", getChangeColor(crashDrop))}>
                          ({crashDrop > 0 ? "+" : ""}{crashDrop}%)
                        </span>
                      )}
                    </td>
                  </>
                )}
                <td className="py-3 px-2 text-right font-mono text-[var(--text-muted)] whitespace-nowrap text-xs">
                  {row.dayBeforePrice.toLocaleString("en-IN")}
                </td>
                {/* % changes: show stock data (3M/6M/1Y), N/A if stock not available at crisis date */}
                <td className={cn("py-3 px-2 text-right font-mono whitespace-nowrap", hasStockData ? getChangeColor(row.stockChange3M ?? null) : getChangeColor(row.change3M))}>
                  {hasStockData
                    ? (row.stockDayBefore != null ? formatChange(row.stockChange3M ?? null) : <span className="text-[var(--text-muted)]">N/A</span>)
                    : formatChange(row.change3M)}
                </td>
                <td className={cn("py-3 px-2 text-right font-mono whitespace-nowrap", hasStockData ? getChangeColor(row.stockChange6M ?? null) : getChangeColor(row.change6M))}>
                  {hasStockData
                    ? (row.stockDayBefore != null ? formatChange(row.stockChange6M ?? null) : <span className="text-[var(--text-muted)]">N/A</span>)
                    : formatChange(row.change6M)}
                </td>
                <td className={cn("py-3 px-2 text-right font-mono whitespace-nowrap", hasStockData ? getChangeColor(row.stockChange1Y ?? null) : getChangeColor(row.change1Y))}>
                  {hasStockData
                    ? (row.stockDayBefore != null ? formatChange(row.stockChange1Y ?? null) : <span className="text-[var(--text-muted)]">N/A</span>)
                    : formatChange(row.change1Y)}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[10px] text-[var(--text-muted)] mt-2 px-2">
        {hasStockData
          ? `${symbol} closing prices shown. Day Before & Crash Day = ₹ close. 3M/6M/1Y = ${symbol} % change from day-before price. N/A = stock not listed at time of crisis. Nifty 50 for reference.`
          : "Nifty 50 index. Day Before = close before event. 3M / 6M / 1Y = % change from day-before price."}
      </p>
    </div>
  );
}
