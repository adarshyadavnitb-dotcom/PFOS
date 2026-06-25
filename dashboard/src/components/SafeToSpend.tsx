import { SafeToSpendStatus } from "../lib/aggregate";
import { inr } from "../lib/format";

export function SafeToSpend({ status }: { status: SafeToSpendStatus }) {
  const onTrack = status.projectedDelta >= 0;
  const watch = status.categoryToWatch;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Daily allowance</div>
        <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
          {inr(status.dailySafeSpend)}
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {inr(status.monthRemaining)} left across {status.daysRemaining} days
        </div>
      </div>

      <div className={`rounded-xl px-3 py-2 text-sm font-semibold ${onTrack ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
        {onTrack ? `${inr(status.projectedDelta)} under projected budget` : `${inr(Math.abs(status.projectedDelta))} over projected budget`}
      </div>

      <div className="rounded-xl bg-black/[0.03] p-3 dark:bg-white/[0.04]">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Watch</div>
        <div className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-white">
          {watch ? watch.category : "No category pressure"}
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {watch
            ? watch.remaining < 0
              ? `${inr(Math.abs(watch.remaining))} over budget`
              : `${watch.usedPct}% used so far`
            : "Spend is tracking below budget pace"}
        </div>
      </div>
    </div>
  );
}
