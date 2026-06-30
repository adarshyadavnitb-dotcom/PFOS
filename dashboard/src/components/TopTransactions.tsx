import { motion } from "framer-motion";
import { Txn } from "../types";
import { catColor } from "../lib/colors";
import { inr, shortDate, parseDate } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

export function TopTransactions({ txns }: { txns: Txn[] }) {
  if (txns.length === 0) return <EmptyChart message="No transactions this month" />;

  const max = txns[0]?.amount || 1;

  return (
    <div className="space-y-1.5">
      {txns.map((t, i) => {
        const barPct = (t.amount / max) * 100;
        const color = catColor(t.category, 0);
        const isTop = i === 0;

        return (
          <motion.div
            key={`${t.date}-${t.merchant}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={`group relative overflow-hidden rounded-2xl px-3 py-2.5 transition-colors duration-200 hover:bg-white/[0.04] ${
              isTop ? "ring-1 ring-white/[0.07]" : ""
            }`}
          >
            {/* Subtle bar fill behind content */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-2xl opacity-[0.055]"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              whileInView={{ width: `${barPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            />

            <div className="relative flex items-center gap-3">
              {/* Rank */}
              <span
                className={`w-5 shrink-0 text-center text-[11px] font-bold tabular-nums ${
                  isTop ? "text-amber-400" : "text-slate-600"
                }`}
              >
                {i + 1}
              </span>

              {/* Name */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-slate-200">{t.merchant}</div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: catColor(t.category, 0) }}
                  />
                  <span className="text-[10px] text-slate-600">{t.category}</span>
                </div>
              </div>

              {/* Date */}
              <span className="shrink-0 text-[10px] tabular-nums text-slate-600">
                {shortDate(parseDate(t.date))}
              </span>

              {/* Amount */}
              <span className={`shrink-0 tabular-nums text-[13px] font-bold ${isTop ? "text-amber-400" : "text-slate-300"}`}>
                {inr(t.amount)}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
