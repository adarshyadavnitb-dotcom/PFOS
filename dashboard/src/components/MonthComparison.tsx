import { TrendingDown, TrendingUp } from "lucide-react";
import { MoMStatus } from "../lib/aggregate";
import { catColor } from "../lib/colors";
import { inr, inrCompact } from "../lib/format";

export function MonthComparison({ status }: { status: MoMStatus }) {
  const { thisMonthLabel, prevMonthLabel, thisMonthTotal, prevMonthTotal, delta, deltaPct, categories } = status;
  const isDown = delta <= 0;
  const maxAmount = Math.max(...categories.map((c) => Math.max(c.thisMonth, c.prevMonth)), 1);

  return (
    <div className="space-y-4">
      {/* Totals */}
      <div className="flex items-end gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {thisMonthLabel}
          </div>
          <div className="text-2xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">
            {inr(thisMonthTotal)}
          </div>
        </div>

        <div
          className={`mb-0.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            isDown
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}
        >
          {isDown ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
          {isDown ? "" : "+"}
          {deltaPct}%
        </div>

        <div className="ml-auto text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {prevMonthLabel}
          </div>
          <div className="text-lg font-bold leading-none text-slate-400 dark:text-slate-500">
            {inr(prevMonthTotal)}
          </div>
        </div>
      </div>

      {/* Category bars */}
      <div className="space-y-3">
        {categories.slice(0, 8).map((cat, i) => (
          <div key={cat.category}>
            <div className="mb-1 flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: catColor(cat.category, i) }}
              />
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-600 dark:text-slate-400">
                {cat.category}
              </span>
              <span className="shrink-0 text-[11px] text-slate-400">{inrCompact(cat.prevMonth)}</span>
              <span className="shrink-0 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {inrCompact(cat.thisMonth)}
              </span>
              {cat.prevMonth > 0 && (
                <span
                  className={`shrink-0 text-[10px] font-bold ${
                    cat.delta <= 0 ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {cat.delta <= 0 ? "↓" : "↑"}
                  {Math.abs(cat.deltaPct)}%
                </span>
              )}
            </div>

            {/* Dual bar */}
            <div className="relative h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
              {/* prev month — background */}
              {cat.prevMonth > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-slate-300 dark:bg-slate-600"
                  style={{ width: `${(cat.prevMonth / maxAmount) * 100}%` }}
                />
              )}
              {/* this month — foreground */}
              {cat.thisMonth > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{
                    width: `${(cat.thisMonth / maxAmount) * 100}%`,
                    backgroundColor: catColor(cat.category, i),
                    opacity: 0.85,
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] font-medium text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-slate-300 dark:bg-slate-600" />
          {prevMonthLabel} (prev)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-blue-500" />
          {thisMonthLabel} (this)
        </span>
      </div>
    </div>
  );
}
