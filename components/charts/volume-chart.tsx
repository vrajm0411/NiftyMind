"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatVolume } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

interface VolumeData {
  timestamp: string;
  open: number;
  close: number;
  volume: number;
}

interface VolumeChartProps {
  data: VolumeData[];
  className?: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="glass-card p-2 text-xs">
      <p className="text-[var(--text-secondary)]">
        {new Date(d.timestamp).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        })}
      </p>
      <p className="font-mono-numbers">Vol: {formatVolume(d.volume)}</p>
    </div>
  );
}

export function VolumeChart({ data, className }: VolumeChartProps) {
  return (
    <GlassCard padding="none" className={className}>
      <div className="p-4 pb-1">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">Volume</h3>
      </div>
      <div className="px-2 pb-2">
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={data} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
            <XAxis dataKey="timestamp" hide />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatVolume}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volume" radius={[2, 2, 0, 0]} maxBarSize={8}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.close >= entry.open
                      ? "rgba(16, 185, 129, 0.4)"
                      : "rgba(244, 63, 94, 0.4)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
