import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Anomaly } from "../lib/aggregate";
import { inrCompact } from "../lib/format";

export function AnomalyAlerts({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mb-5 flex items-center gap-3 rounded-[22px] border border-emerald-500/[0.12] bg-emerald-500/[0.06] px-5 py-3.5"
      >
        <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
        <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
          Spending normal across all categories this week
        </span>
      </motion.div>
    );
  }

  return (
    <div className="mb-5">
      <div className="mb-2.5 flex items-center gap-2">
        <AlertTriangle size={13} className="text-amber-500" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Spending alerts · last 7 days
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {anomalies.map((a, i) => (
          <motion.div
            key={a.category}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-[1px]"
            style={{
              background:
                a.ratio >= 3
                  ? "linear-gradient(135deg, rgba(239,68,68,0.35), rgba(239,68,68,0.06))"
                  : "linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.05))",
            }}
          >
            <div className="rounded-[14px] bg-slate-950/85 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-bold text-slate-300">{a.category}</div>
                  <div
                    className={`mt-0.5 text-[10px] font-medium ${
                      a.ratio >= 3 ? "text-rose-400" : "text-amber-400"
                    }`}
                  >
                    {a.ratio}× your usual
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="tabular-nums text-sm font-extrabold text-slate-100">
                    {inrCompact(a.recentSpend)}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    +{inrCompact(a.deltaAmount)} extra
                  </div>
                </div>
              </div>

              {/* Comparison bar */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-white/20"
                      style={{ width: `${(1 / a.ratio) * 100}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[9px] tabular-nums text-slate-600">
                    {inrCompact(a.baselineSpend)} usual
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      className={`h-full rounded-full ${a.ratio >= 3 ? "bg-rose-500" : "bg-amber-500"}`}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.9, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span className="shrink-0 text-[9px] tabular-nums text-slate-400">
                    {inrCompact(a.recentSpend)} now
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
