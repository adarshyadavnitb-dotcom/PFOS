import { inr } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

export function NeedWantBar({ need, want }: { need: number; want: number }) {
  const total = need + want;
  if (total === 0) return <EmptyChart />;
  const needPct = Math.round((need / total) * 100);
  const wantPct = 100 - needPct;

  return (
    <div>
      <div className="flex h-5 w-full overflow-hidden rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
          style={{ width: `${needPct}%` }}
        />
        <div
          className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all duration-500"
          style={{ width: `${wantPct}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-500/10 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Needs · {needPct}%
          </div>
          <div className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{inr(need)}</div>
        </div>
        <div className="rounded-xl bg-fuchsia-500/10 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400">
            <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500" /> Wants · {wantPct}%
          </div>
          <div className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{inr(want)}</div>
        </div>
      </div>
    </div>
  );
}
