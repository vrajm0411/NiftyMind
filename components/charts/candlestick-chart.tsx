"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  className?: string;
}

const intervals = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];

// Custom candle shape
function CandleShape(props: any) {
  const { x, width, payload } = props;
  if (!payload) return null;

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? "#10b981" : "#f43f5e";
  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);

  const chartMin = props.yAxis?.scale?.domain?.()?.[0] ?? 0;
  const chartMax = props.yAxis?.scale?.domain?.()?.[1] ?? 1;
  const scale = (v: number) => {
    const h = props.viewBox?.height ?? 200;
    const top = props.viewBox?.y ?? 0;
    return top + h - ((v - chartMin) / (chartMax - chartMin)) * h;
  };

  const candleWidth = Math.max(width * 0.6, 3);
  const cx = x + width / 2;

  return (
    <g>
      {/* Wick */}
      <line
        x1={cx}
        y1={scale(high)}
        x2={cx}
        y2={scale(low)}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={cx - candleWidth / 2}
        y={scale(bodyBottom)}
        width={candleWidth}
        height={Math.max(Math.abs(scale(bodyTop) - scale(bodyBottom)), 1)}
        fill={isUp ? color : color}
        stroke={color}
        strokeWidth={0.5}
        rx={1}
      />
    </g>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const isUp = d.close >= d.open;

  return (
    <div className="glass-card p-3 text-xs space-y-1 min-w-[150px]">
      <p className="text-[var(--text-secondary)]">
        {new Date(d.timestamp).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono-numbers">
        <span className="text-[var(--text-muted)]">O</span>
        <span>{formatCurrency(d.open)}</span>
        <span className="text-[var(--text-muted)]">H</span>
        <span>{formatCurrency(d.high)}</span>
        <span className="text-[var(--text-muted)]">L</span>
        <span>{formatCurrency(d.low)}</span>
        <span className="text-[var(--text-muted)]">C</span>
        <span className={isUp ? "text-emerald-400" : "text-rose-400"}>
          {formatCurrency(d.close)}
        </span>
      </div>
    </div>
  );
}

export function CandlestickChart({ data, className }: CandlestickChartProps) {
  const [selectedInterval, setSelectedInterval] = useState(90);

  const filteredData = useMemo(() => {
    const cutoff = Date.now() - selectedInterval * 24 * 60 * 60 * 1000;
    return data
      .filter((d) => new Date(d.timestamp).getTime() >= cutoff)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data, selectedInterval]);

  return (
    <GlassCard padding="none" className={className}>
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
          Price Chart
        </h3>
        <div className="flex gap-1">
          {intervals.map((i) => (
            <button
              key={i.label}
              onClick={() => setSelectedInterval(i.days)}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium transition-colors",
                selectedInterval === i.days
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 pb-2">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={filteredData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(0,212,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
              }
              stroke="var(--text-muted)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              stroke="var(--text-muted)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v}`}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="high"
              shape={<CandleShape />}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
