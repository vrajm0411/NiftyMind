"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function MiniSparkline({
  data,
  color,
  width = 80,
  height = 30,
}: MiniSparklineProps) {
  const chartData = data.map((v) => ({ v }));
  const isUp = data.length >= 2 && data[data.length - 1] >= data[0];
  const lineColor = color ?? (isUp ? "#10b981" : "#f43f5e");

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
