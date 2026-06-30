import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CategoryTrendData } from "../lib/aggregate";
import { catColor } from "../lib/colors";
import { inr, inrCompact } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-slate-950/95 px-4 py-3 text-xs shadow-2xl">
      <div className="mb-2 font-bold text-white tracking-tight">{label} · {inr(total)}</div>
      {[...payload].reverse().map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-[3px]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="flex-1 text-slate-400">{p.dataKey}</span>
          <span className="tabular-nums font-semibold text-slate-200">{inrCompact(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function CategoryTrendChart({ data }: { data: CategoryTrendData }) {
  if (data.points.length === 0) return <EmptyChart />;

  const monthTotals = data.points.map((p) => ({
    month: p.month as string,
    total: data.topCategories.reduce((s, c) => s + ((p[c] as number) || 0), 0),
  }));
  const peakMonth = monthTotals.reduce((a, b) => (b.total > a.total ? b : a));
  const latestMonth = monthTotals[monthTotals.length - 1];

  return (
    <div className="flex flex-col gap-5">
      {/* Top stat row */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">This month</div>
          <div className="mt-1 text-[1.65rem] font-extrabold leading-none tracking-tight text-slate-100">
            {inr(latestMonth.total)}
          </div>
        </div>
        <div className="rounded-[14px] bg-white/[0.04] ring-1 ring-white/[0.07] px-3 py-2 text-right">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Peak month</div>
          <div className="mt-0.5 text-[13px] font-bold text-amber-400">{peakMonth.month}</div>
          <div className="text-[10px] tabular-nums text-slate-500">{inrCompact(peakMonth.total)}</div>
        </div>
      </div>

      {/* Stacked bar chart */}
      <ResponsiveContainer width="100%" height={178}>
        <BarChart data={data.points} margin={{ top: 4, right: 2, left: -20, bottom: 0 }} barCategoryGap="32%">
          <CartesianGrid strokeDasharray="2 5" stroke="rgba(148,163,184,0.07)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "rgba(148,163,184,0.6)", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "rgba(148,163,184,0.6)" }}
            axisLine={false}
            tickLine={false}
            width={42}
            tickFormatter={inrCompact}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(148,163,184,0.04)", rx: 6 }} />
          {data.topCategories.map((cat, i) => (
            <Bar
              key={cat}
              dataKey={cat}
              stackId="a"
              fill={catColor(cat, i)}
              radius={i === data.topCategories.length - 1 ? [5, 5, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Category legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {data.topCategories.map((cat, i) => (
          <span key={cat} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: catColor(cat, i) }} />
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}
