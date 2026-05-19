"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

interface PieData {
  name: string;
  value: number;
  color?: string;
}

interface PortfolioPieProps {
  data: PieData[];
  total?: number;
  className?: string;
}

const COLORS = [
  "#00d4ff",
  "#00b4a6",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="glass-card p-2.5 text-xs">
      <p className="font-medium mb-1">{d.name}</p>
      <p className="font-mono-numbers">{formatCurrency(d.value)}</p>
      <p className="text-[var(--text-muted)]">
        {((d.value / d.payload.total) * 100).toFixed(1)}%
      </p>
    </div>
  );
}

export function PortfolioPie({ data, total, className }: PortfolioPieProps) {
  const computedTotal = total ?? data.reduce((sum, d) => sum + d.value, 0);
  const enriched = data.map((d) => ({ ...d, total: computedTotal }));

  return (
    <GlassCard className={className}>
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
        Allocation
      </h3>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={enriched}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                dataKey="value"
                strokeWidth={0}
              >
                {enriched.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.color || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5 max-h-28 overflow-y-auto">
          {data.slice(0, 8).map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: d.color || COLORS[i % COLORS.length] }}
              />
              <span className="text-[var(--text-secondary)] truncate flex-1">
                {d.name}
              </span>
              <span className="font-mono-numbers text-[var(--text-muted)]">
                {((d.value / computedTotal) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
