import { motion } from "framer-motion";
import { CategoryProjection } from "../lib/aggregate";
import { catColor } from "../lib/colors";
import { inrCompact } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

export function CategoryProjections({ data }: { data: CategoryProjection[] }) {
  if (data.length === 0) return <EmptyChart />;

  const maxProjected = Math.max(...data.map((d) => Math.max(d.projected, d.budget)), 1);

  return (
    <div className="space-y-3">
      {data.map((row, i) => {
        const color = catColor(row.category, i);
        const actualW = Math.min((row.actual / maxProjected) * 100, 100);
        const projW = Math.min((row.projected / maxProjected) * 100, 100);
        const budgetW = Math.min((row.budget / maxProjected) * 100, 100);
        const overrun = row.projectedDelta > 0;

        return (
          <motion.div
            key={row.category}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.42, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[11px] font-medium text-slate-400">{row.category}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] tabular-nums">
                <span className="text-slate-600">{inrCompact(row.actual)} spent</span>
                <span className="font-semibold text-slate-400">
                  → {inrCompact(row.projected)} projected
                </span>
                <span
                  className={`font-bold ${overrun ? "text-rose-400" : "text-emerald-400"}`}
                >
                  {overrun ? "+" : "−"}
                  {inrCompact(Math.abs(row.projectedDelta))} {overrun ? "over" : "under"}
                </span>
              </div>
            </div>

            {/* Compound bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
              {/* Projected extent */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full opacity-20"
                style={{ backgroundColor: overrun ? "#f87171" : color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${projW}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
              {/* Actual spent */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: overrun ? "#f87171" : color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${actualW}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, delay: 0.15 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
              {/* Budget marker */}
              <div
                className="absolute inset-y-0 w-[2px] rounded-full bg-white/40"
                style={{ left: `${budgetW}%` }}
              />
            </div>

            <div className="mt-1 flex items-center gap-3 text-[9px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="h-1 w-3 rounded-full opacity-30" style={{ backgroundColor: color }} />
                Projected
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1 w-3 rounded-full" style={{ backgroundColor: color }} />
                Actual
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-[2px] rounded-full bg-white/40" />
                Budget {inrCompact(row.budget)}
              </span>
            </div>
          </motion.div>
        );
      })}

      {/* Summary footer */}
      <div className="mt-1 flex items-center gap-2 pt-1 text-[10px] text-slate-600">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
        <span>Red = projected to exceed budget</span>
        <span className="ml-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span>Green = on track</span>
      </div>
    </div>
  );
}
