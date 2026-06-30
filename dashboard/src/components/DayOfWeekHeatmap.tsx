import { DowPoint } from "../lib/aggregate";
import { inr } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

export function DayOfWeekHeatmap({ data }: { data: DowPoint[] }) {
  if (data.every((d) => d.total === 0)) return <EmptyChart message="Not enough data yet" />;

  const maxAvg = Math.max(...data.map((d) => d.avg), 1);

  return (
    <div className="space-y-4">
      {/* Heat tiles */}
      <div className="grid grid-cols-7 gap-1.5">
        {data.map((d) => {
          const intensity = d.avg / maxAvg;
          // Map intensity to opacity of blue
          const opacity = 0.08 + intensity * 0.82;
          const isHot = intensity > 0.7;
          return (
            <div
              key={d.day}
              className="group relative flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-transform hover:scale-105"
              style={{ backgroundColor: `rgba(0, 122, 255, ${opacity})` }}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wide ${
                  isHot ? "text-white" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {d.day}
              </span>
              <span
                className={`text-[11px] font-extrabold leading-none ${
                  isHot ? "text-white" : "text-slate-800 dark:text-white"
                }`}
              >
                {d.avg > 0 ? `₹${Math.round(d.avg / 1000) > 0 ? (d.avg / 1000).toFixed(1) + "k" : d.avg}` : "—"}
              </span>

              {/* Hover tooltip */}
              <div className="pointer-events-none absolute -top-14 left-1/2 z-10 hidden w-32 -translate-x-1/2 rounded-xl border border-black/10 bg-white px-2 py-1.5 text-[10px] shadow-lg group-hover:block dark:border-white/15 dark:bg-slate-900">
                <div className="font-semibold text-slate-700 dark:text-slate-200">{d.day}</div>
                <div className="text-slate-500">Avg: {inr(d.avg)}</div>
                <div className="text-slate-500">Total: {inr(d.total)}</div>
                <div className="text-slate-500">{d.count} transactions</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend row */}
      <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
        <span>avg spend per transaction · last 3 months</span>
        <div className="flex items-center gap-1.5">
          <span>low</span>
          {[0.1, 0.3, 0.55, 0.78, 1].map((o) => (
            <span
              key={o}
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: `rgba(0,122,255,${0.08 + o * 0.82})` }}
            />
          ))}
          <span>high</span>
        </div>
      </div>

      {/* Peak day callout */}
      {(() => {
        const peak = data.reduce((a, b) => (b.avg > a.avg ? b : a));
        const low = data.reduce((a, b) => (b.avg < a.avg && b.avg > 0 ? b : a));
        if (peak.avg === 0) return null;
        return (
          <div className="rounded-xl bg-blue-500/10 px-3 py-2 text-[11px] font-medium text-blue-700 dark:text-blue-300">
            You spend most on <span className="font-bold">{peak.day}</span> (avg {inr(peak.avg)})
            {low.avg > 0 && <>, least on <span className="font-bold">{low.day}</span> (avg {inr(low.avg)})</>}.
          </div>
        );
      })()}
    </div>
  );
}
