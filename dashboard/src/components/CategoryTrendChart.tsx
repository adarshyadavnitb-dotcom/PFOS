import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CategoryTrendData } from "../lib/aggregate";
import { catColor } from "../lib/colors";
import { inr, inrCompact } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs shadow-xl dark:border-white/15 dark:bg-slate-900">
      <div className="mb-1.5 font-semibold text-slate-700 dark:text-slate-200">{label} · {inr(total)}</div>
      {[...payload].reverse().map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span className="h-1.5 w-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="flex-1">{p.dataKey}</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{inrCompact(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function CategoryTrendChart({ data }: { data: CategoryTrendData }) {
  if (data.points.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data.points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.10)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "rgb(148 163 184)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "rgb(148 163 184)" }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => inrCompact(v)}
        />
        <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(148,163,184,0.06)" }} />
        {data.topCategories.map((cat, i) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="a"
            fill={catColor(cat, i)}
            radius={i === data.topCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
