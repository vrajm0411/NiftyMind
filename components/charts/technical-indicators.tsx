"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

interface PriceData {
  timestamp: string;
  close: number;
  volume: number;
}

interface TechnicalIndicatorsProps {
  data: PriceData[];
  className?: string;
}

function computeSMA(data: number[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function computeRSI(data: number[], period = 14): (number | null)[] {
  const rsi: (number | null)[] = new Array(data.length).fill(null);

  for (let i = period; i < data.length; i++) {
    let gains = 0;
    let losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const change = data[j] - data[j - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + rs);
  }
  return rsi;
}

const indicatorOptions = [
  { key: "sma20", label: "SMA 20", color: "#00d4ff" },
  { key: "sma50", label: "SMA 50", color: "#f59e0b" },
  { key: "sma200", label: "SMA 200", color: "#f43f5e" },
];

export function TechnicalIndicators({ data, className }: TechnicalIndicatorsProps) {
  const [active, setActive] = useState<Set<string>>(new Set(["sma20", "sma50"]));
  const [showRSI, setShowRSI] = useState(true);

  const chartData = useMemo(() => {
    const closes = data.map((d) => d.close);
    const sma20 = computeSMA(closes, 20);
    const sma50 = computeSMA(closes, 50);
    const sma200 = computeSMA(closes, 200);
    const rsi = computeRSI(closes);

    return data.map((d, i) => ({
      ...d,
      sma20: sma20[i],
      sma50: sma50[i],
      sma200: sma200[i],
      rsi: rsi[i],
    }));
  }, [data]);

  const toggle = (key: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <GlassCard padding="none" className={className}>
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
          Technical Indicators
        </h3>
        <div className="flex gap-1">
          {indicatorOptions.map((ind) => (
            <button
              key={ind.key}
              onClick={() => toggle(ind.key)}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium transition-colors",
                active.has(ind.key)
                  ? "text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
              style={active.has(ind.key) ? { backgroundColor: ind.color + "30", color: ind.color } : {}}
            >
              {ind.label}
            </button>
          ))}
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={cn(
              "px-2 py-1 rounded text-xs font-medium transition-colors",
              showRSI
                ? "bg-gold-500/20 text-gold-500"
                : "text-[var(--text-muted)]"
            )}
          >
            RSI
          </button>
        </div>
      </div>

      {/* SMA Overlay */}
      <div className="px-2">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
              }
              stroke="var(--text-muted)"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v}`}
              width={65}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-glass)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              labelFormatter={(v) =>
                new Date(v).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              }
            />
            <Line type="monotone" dataKey="close" stroke="#94a3b8" strokeWidth={1.5} dot={false} />
            {active.has("sma20") && (
              <Line type="monotone" dataKey="sma20" stroke="#00d4ff" strokeWidth={1} dot={false} strokeDasharray="4 2" />
            )}
            {active.has("sma50") && (
              <Line type="monotone" dataKey="sma50" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="4 2" />
            )}
            {active.has("sma200") && (
              <Line type="monotone" dataKey="sma200" stroke="#f43f5e" strokeWidth={1} dot={false} strokeDasharray="4 2" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* RSI */}
      {showRSI && (
        <div className="px-2 pb-2 border-t border-[var(--border-subtle)]">
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <YAxis
                domain={[0, 100]}
                ticks={[30, 70]}
                stroke="var(--text-muted)"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(v) => [Number(v)?.toFixed(1), "RSI"]}
              />
              <Line type="monotone" dataKey="rsi" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              {/* Overbought/oversold lines */}
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
