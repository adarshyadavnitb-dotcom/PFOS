import { motion } from "framer-motion";
import { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  sub,
  icon,
  accent = "violet",
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent?: "violet" | "cyan" | "emerald" | "amber" | "rose";
  delay?: number;
}) {
  const accents: Record<string, string> = {
    violet: "from-violet-500/20 to-violet-500/5 text-violet-500",
    cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-500",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-500",
    rose: "from-rose-500/20 to-rose-500/5 text-rose-500",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass glass-hover p-5"
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${accents[accent]}`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
    </motion.div>
  );
}
