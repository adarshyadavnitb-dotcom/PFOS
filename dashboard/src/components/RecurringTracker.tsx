import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { RecurringItem } from "../lib/aggregate";
import { catColor } from "../lib/colors";
import { inr, inrCompact } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

export function RecurringTracker({ data }: { data: RecurringItem[] }) {
  if (data.length === 0) return <EmptyChart message="No recurring patterns detected yet" />;

  const totalMonthly = data.reduce((s, d) => s + d.avgAmount, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* List */}
      <div className="space-y-1.5">
        {data.map((item, i) => (
          <motion.div
            key={item.merchant}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-200 hover:bg-white/[0.04]"
          >
            {/* Category color dot */}
            <div
              className="grid h-7 w-7 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: `${catColor(item.category, i)}18` }}
            >
              <RefreshCw size={11} style={{ color: catColor(item.category, i) }} />
            </div>

            {/* Name + category */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-slate-200">{item.merchant}</div>
              <div className="text-[10px] text-slate-600">{item.category}</div>
            </div>

            {/* Recurrence badge */}
            <div
              className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{
                backgroundColor: `${catColor(item.category, i)}14`,
                color: catColor(item.category, i),
              }}
            >
              {item.monthsSeen === 3 ? "3 months" : `${item.monthsSeen}mo`}
            </div>

            {/* Amount */}
            <div className="shrink-0 tabular-nums text-[13px] font-bold text-slate-300">
              {inrCompact(item.avgAmount)}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Total committed footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="rounded-2xl p-[1px]"
        style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.22), rgba(99,102,241,0.04))" }}
      >
        <div className="flex items-center justify-between rounded-[14px] bg-slate-950/80 px-4 py-2.5">
          <span className="text-[11px] font-medium text-slate-500">Monthly commitment</span>
          <span className="tabular-nums text-[15px] font-extrabold text-slate-200">
            {inr(totalMonthly)}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
