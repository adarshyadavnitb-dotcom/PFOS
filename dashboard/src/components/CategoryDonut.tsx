import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CatSlice } from "../lib/aggregate";
import { catColor } from "../lib/colors";
import { inr } from "../lib/format";
import { ChartTooltip, EmptyChart } from "./ChartTooltip";

export function CategoryDonut({ data }: { data: CatSlice[] }) {
  if (data.length === 0) return <EmptyChart />;
  const total = data.reduce((s, d) => s + d.amount, 0);
  const chartData = data.map((d) => ({ name: d.category, value: d.amount }));

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((d, i) => (
                <Cell key={d.name} fill={catColor(d.name, i)} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">Total</div>
            <div className="text-base font-bold text-slate-800 dark:text-white">{inr(total)}</div>
          </div>
        </div>
      </div>

      <div className="w-full space-y-1.5">
        {data.slice(0, 6).map((d, i) => {
          const pct = total > 0 ? Math.round((d.amount / total) * 100) : 0;
          return (
            <div key={d.category} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: catColor(d.category, i) }} />
              <span className="flex-1 truncate text-slate-600 dark:text-slate-300">{d.category}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{inr(d.amount)}</span>
              <span className="w-9 text-right text-xs text-slate-400">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
