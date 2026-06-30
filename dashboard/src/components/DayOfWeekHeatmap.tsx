import { motion } from "framer-motion";
import { DowPoint } from "../lib/aggregate";
import { inrCompact } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

export function DayOfWeekHeatmap({ data }: { data: DowPoint[] }) {
  if (data.every((d) => d.total === 0)) return <EmptyChart message="Not enough data yet" />;

  const maxAvg = Math.max(...data.map((d) => d.avg), 1);
  const peak = data.reduce((a, b) => (b.avg > a.avg ? b : a));
  const activeData = data.filter((d) => d.avg > 0);
  const low = activeData.length > 0 ? activeData.reduce((a, b) => (b.avg < a.avg ? b : a)) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Heat tiles */}
      <div className="grid grid-cols-7 gap-1.5">
        {data.map((d, i) => {
          const intensity = maxAvg > 0 ? d.avg / maxAvg : 0;
          const isPeak = d.avg > 0 && d.day === peak.day;
          const isEmpty = d.avg === 0;

          return (
            <motion.div
              key={d.day}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl px-1 py-3.5"
              style={{
                background: isEmpty
                  ? "rgba(255,255,255,0.02)"
                  : isPeak
                  ? `rgba(0, 122, 255, ${0.1 + intensity * 0.22})`
                  : `rgba(0, 122, 255, ${0.03 + intensity * 0.14})`,
                boxShadow: isPeak ? "inset 0 1px 0 rgba(255,255,255,0.1)" : undefined,
                border: isPeak ? "1px solid rgba(0,122,255,0.28)" : "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {/* Day label */}
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: isPeak ? "#93c5fd" : "rgba(148,163,184,0.6)" }}
              >
                {d.day}
              </span>

              {/* Amount */}
              <span
                className="text-[11px] font-extrabold leading-none tabular-nums"
                style={{
                  color: isEmpty ? "rgba(148,163,184,0.25)" : isPeak ? "#bfdbfe" : "rgba(226,232,240,0.85)",
                }}
              >
                {isEmpty ? "—" : d.avg >= 1000 ? `${(d.avg / 1000).toFixed(1)}k` : String(d.avg)}
              </span>

              {/* Intensity bar */}
              <div className="h-0.5 w-full rounded-full bg-white/[0.05]">
                {!isEmpty && (
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${intensity * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{
                      background: isPeak
                        ? "linear-gradient(90deg, #60a5fa, #93c5fd)"
                        : "rgba(96,165,250,0.5)",
                    }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Insight chips — Double-Bezel style */}
      {peak.avg > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {/* Peak */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-[1px]"
            style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.06))" }}
          >
            <div className="rounded-[14px] bg-slate-950/80 px-3.5 py-3">
              <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-rose-400/70">
                Most active
              </div>
              <div className="text-[13px] font-bold text-rose-300">{peak.day}</div>
              <div className="mt-0.5 text-[11px] tabular-nums text-slate-400">
                {inrCompact(peak.avg)} avg · {peak.count} txns
              </div>
            </div>
          </motion.div>

          {/* Low */}
          {low && low.avg > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl p-[1px]"
              style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.05))" }}
            >
              <div className="rounded-[14px] bg-slate-950/80 px-3.5 py-3">
                <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-emerald-400/70">
                  Most restrained
                </div>
                <div className="text-[13px] font-bold text-emerald-300">{low.day}</div>
                <div className="mt-0.5 text-[11px] tabular-nums text-slate-400">
                  {inrCompact(low.avg)} avg · {low.count} txns
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-slate-600">
        Average spend per transaction · last 3 months
      </p>
    </div>
  );
}
