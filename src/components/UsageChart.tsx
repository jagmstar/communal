"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface UsageChartProps {
  data: { month: string; usage: number; cost: number }[];
  color?: string;
  showCost?: boolean;
}

export function UsageChart({ data, color = "#0891b2", showCost = false }: UsageChartProps) {
  return (
    <div className="h-[160px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#78716c" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e7e5e4",
              fontSize: "12px",
              padding: "8px 12px",
            }}
            formatter={(value: any) => [
              showCost ? `${value} ₴` : `${value}`,
              showCost ? "Вартість" : "Витрата",
            ]}
          />
          <Bar dataKey={showCost ? "cost" : "usage"} radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={color} fillOpacity={0.3 + (index / data.length) * 0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
