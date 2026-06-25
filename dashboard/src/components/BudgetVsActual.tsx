import { BudgetStatus } from "../lib/aggregate";
import { catColor } from "../lib/colors";
import { inr } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

function tone(usedPct: number) {
  if (usedPct >= 100) return "bg-rose-500";
  if (usedPct >= 85) return "bg-amber-500";
  return "bg-emerald-500";
}

export function BudgetVsActual({ status }: { status: BudgetStatus }) {
  if (status.totalBudget === 0) return <EmptyChart />;
  const rows = status.rows.slice(0, 6);
  const monthTone = tone(status.usedPct);

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-black/[0.03] p-3 dark:bg-white/[0.04]">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Spent</div>
          <div className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{inr(status.totalActual)}</div>
        </div>
        <div className="rounded-xl bg-black/[0.03] p-3 dark:bg-white/[0.04]">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Budget</div>
          <div className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{inr(status.totalBudget)}</div>
        </div>
        <div className="rounded-xl bg-black/[0.03] p-3 dark:bg-white/[0.04]">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Left</div>
          <div className={`mt-1 text-lg font-bold ${status.remaining < 0 ? "text-rose-500" : "text-slate-800 dark:text-white"}`}>
            {inr(status.remaining)}
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{status.usedPct}% used</span>
          <span>{status.pacePct}% month pace</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
          <div className={`h-full rounded-full ${monthTone} transition-all duration-500`} style={{ width: `${Math.min(status.usedPct, 100)}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={row.category}>
            <div className="mb-1 flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: catColor(row.category, i) }} />
              <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">{row.category}</span>
              <span className="shrink-0 font-semibold text-slate-700 dark:text-slate-200">
                {inr(row.actual)} / {inr(row.budget)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
              <div className={`h-full rounded-full ${tone(row.usedPct)} transition-all duration-500`} style={{ width: `${Math.min(row.usedPct, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-700 dark:text-cyan-300">
        Projected month close: {inr(status.projectedSpend)}
      </div>
    </div>
  );
}
