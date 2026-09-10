"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from "recharts";

interface UsageChartProps {
  data: { month: string; usage: number; cost: number }[];
  color?: string;
  showCost?: boolean;
  unit?: string;
}

/**
 * Bar chart with a single labeled y-axis (design spec §2.3 / audit #3).
 * Previously the axis had no unit label and, with very few data points,
 * recharts would render sparse/garbled-looking ticks that read as two
 * overlaid scales ("2.2 65 1.1 55 0"). Fixing this requires: an explicit
 * `domain={[0, 'dataMax']}` + fixed `tickCount` so the axis always has a
 * clean, evenly-spaced scale; light gridlines at each tick (spec calls for
 * 25/50/75/100% gridlines); and a unit suffix on the axis label so it's
 * clear whether the numbers are м³/кВт·год or ₴.
 */
export function UsageChart({ data, color = "#14b8a6", showCost = false, unit = "" }: UsageChartProps) {
  const dataKey = showCost ? "cost" : "usage";
  // Guard against non-finite/degenerate values (e.g. NaN sneaking in from an
  // upstream calculation, or a transient measurement during a live resize —
  // see ChartErrorBoundary.tsx for the 2026-09-10 investigation). Without
  // this, Math.max(...) over an array containing NaN returns NaN, which
  // propagates into `niceMax` (still NaN) and then into recharts'
  // `domain={[0, NaN]}`, a malformed prop that recharts is not guaranteed to
  // handle gracefully mid-render.
  const safeValues = data.map((d) => d[dataKey]).filter((v) => Number.isFinite(v));
  const maxValue = Math.max(1, ...safeValues);
  // Round the axis max up to a "nice" number so ticks land on clean values.
  const niceMax = Number.isFinite(maxValue) ? Math.ceil(maxValue * 1.15 * 100) / 100 : 1;

  return (
    <div className="h-[180px] w-full" role="img" aria-label={`Графік витрати за ${data.length} місяців, у ${unit || (showCost ? "₴" : "")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, niceMax]}
            tickCount={5}
            tick={{ fontSize: 10, fill: "#78716c" }}
            axisLine={false}
            tickLine={false}
            width={44}
            label={{
              value: unit || (showCost ? "₴" : ""),
              position: "insideTopLeft",
              offset: -4,
              fontSize: 10,
              fill: "#78716c",
            }}
          />
          <Tooltip
            cursor={{ fill: "rgba(28, 25, 23, 0.04)" }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e7e5e4",
              fontSize: "12px",
              padding: "8px 12px",
            }}
            formatter={(value) => [
              showCost ? `${value} ₴` : `${value} ${unit}`,
              showCost ? "Вартість" : "Витрата",
            ]}
          />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((_, index) => (
              <Cell key={index} fill={color} fillOpacity={0.3 + (index / data.length) * 0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
