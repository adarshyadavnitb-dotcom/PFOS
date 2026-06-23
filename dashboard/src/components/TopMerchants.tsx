import { CatSlice } from "../lib/aggregate";
import { inr } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

export function TopMerchants({ data }: { data: CatSlice[] }) {
  if (data.length === 0) return <EmptyChart />;
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.category}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate text-slate-600 dark:text-slate-300">{d.category}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{inr(d.amount)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${(d.amount / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
