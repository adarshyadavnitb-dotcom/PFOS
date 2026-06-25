import { CashflowCalendarStatus } from "../lib/aggregate";
import { inr, inrCompact } from "../lib/format";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function dayTone(spend: number, dailyBudget: number) {
  if (spend === 0) return "bg-black/[0.025] text-slate-500 dark:bg-[#2c2c2e] dark:text-slate-200";
  if (dailyBudget === 0 || spend <= dailyBudget) return "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-200";
  if (spend <= dailyBudget * 1.5) return "bg-amber-500/15 text-amber-700 dark:bg-amber-400/14 dark:text-amber-200";
  return "bg-rose-500/15 text-rose-700 dark:bg-rose-400/14 dark:text-rose-200";
}

export function CashflowCalendar({ status }: { status: CashflowCalendarStatus }) {
  const blanks = Array.from({ length: status.leadingBlanks });

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{status.monthLabel}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Daily pace: {inr(status.dailyBudget)}</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" /> on pace
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" /> warm
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" /> hot
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d, i) => (
            <div key={`${d}-${i}`} className="pb-1 text-center text-[11px] font-bold text-slate-400">
              {d}
            </div>
          ))}
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="min-h-20 rounded-2xl" />
          ))}
          {status.days.map((day) => (
            <div
              key={day.date}
              className={`min-h-20 rounded-2xl border p-2 transition-colors ${
                day.isToday
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-black/[0.04] dark:border-white/[0.06]"
              } ${dayTone(day.spend, status.dailyBudget)} ${day.isFuture ? "opacity-75" : ""}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${day.isToday ? "bg-blue-500 text-white" : ""}`}>
                  {day.day}
                </span>
                {day.isPayday && <span className="rounded-full bg-blue-500/12 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-300">pay</span>}
              </div>
              <div className="mt-3 min-w-0 truncate text-xs font-bold">
                {day.spend > 0 ? inrCompact(day.spend) : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl bg-black/[0.03] p-4 dark:bg-[#2c2c2e]">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Income</div>
          <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{inr(status.income)}</div>
        </div>
        <div className="rounded-2xl bg-black/[0.03] p-4 dark:bg-[#2c2c2e]">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Projected spend</div>
          <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{inr(status.projectedSpend)}</div>
          <div className={`mt-1 text-xs font-semibold ${status.projectedSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {status.projectedSavings >= 0 ? `${inr(status.projectedSavings)} projected savings` : `${inr(Math.abs(status.projectedSavings))} projected shortfall`}
          </div>
        </div>
        <div className="rounded-2xl bg-black/[0.03] p-4 dark:bg-[#2c2c2e]">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Hot days</div>
          <div className="mt-2 space-y-2">
            {status.highSpendDays.length === 0 ? (
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">No spikes this month</div>
            ) : (
              status.highSpendDays.map((day) => (
                <div key={day.date} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Day {day.day}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{inr(day.spend)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
