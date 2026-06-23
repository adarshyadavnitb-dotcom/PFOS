import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SeriesPoint } from "../lib/aggregate";
import { inrCompact } from "../lib/format";
import { ChartTooltip, EmptyChart } from "./ChartTooltip";

export function SpendTrendChart({ data }: { data: SeriesPoint[] }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "rgb(148 163 184)" }}
          axisLine={false}
          tickLine={false}
          minTickGap={20}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "rgb(148 163 184)" }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => inrCompact(v)}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(139,92,246,0.4)" }} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#8b5cf6"
          strokeWidth={2.5}
          fill="url(#spendFill)"
          dot={false}
          activeDot={{ r: 4, fill: "#a78bfa" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
