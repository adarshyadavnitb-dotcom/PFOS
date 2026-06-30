import { motion } from "framer-motion";
import { ReactNode } from "react";

const ACCENTS: Record<string, { bg: string; text: string; bar: string }> = {
  blue:    { bg: "bg-blue-500/[0.12] dark:bg-blue-400/[0.12]",    text: "text-blue-600 dark:text-blue-400",    bar: "bg-blue-500" },
  indigo:  { bg: "bg-indigo-500/[0.12] dark:bg-indigo-400/[0.12]", text: "text-indigo-600 dark:text-indigo-400", bar: "bg-indigo-500" },
  emerald: { bg: "bg-emerald-500/[0.12] dark:bg-emerald-400/[0.12]", text: "text-emerald-700 dark:text-emerald-400", bar: "bg-emerald-500" },
  amber:   { bg: "bg-amber-500/[0.12] dark:bg-amber-400/[0.12]",  text: "text-amber-700 dark:text-amber-400",  bar: "bg-amber-500" },
  rose:    { bg: "bg-rose-500/[0.12] dark:bg-rose-400/[0.12]",    text: "text-rose-600 dark:text-rose-400",    bar: "bg-rose-500" },
  cyan:    { bg: "bg-cyan-500/[0.12] dark:bg-cyan-400/[0.12]",    text: "text-cyan-700 dark:text-cyan-400",    bar: "bg-cyan-500" },
  violet:  { bg: "bg-violet-500/[0.12] dark:bg-violet-400/[0.12]", text: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500" },
};

export function KpiCard({
  label,
  value,
  sub,
  icon,
  accent = "blue",
  delay = 0,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent?: keyof typeof ACCENTS;
  delay?: number;
  /** trend.label e.g. "+8%" or "−12%", trend.positive = green, false = red */
  trend?: { label: string; positive: boolean };
}) {
  const a = ACCENTS[accent] ?? ACCENTS.blue;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.015, transition: { type: "spring", stiffness: 380, damping: 26 } }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="glass glass-hover relative overflow-hidden p-5 cursor-default"
    >
      {/* Accent bar */}
      <div className={`absolute inset-x-0 top-0 h-[2.5px] rounded-t-[22px] ${a.bar}`} />

      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${a.bg} ${a.text}`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-[1.75rem] font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">
        {value}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {sub && (
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{sub}</span>
        )}
        {trend && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              trend.positive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            {trend.label}
          </span>
        )}
      </div>
    </motion.div>
  );
}
