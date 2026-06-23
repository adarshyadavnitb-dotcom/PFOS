import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function InsightCard({ text, loading }: { text?: string; loading: boolean }) {
  return (
    <div className="glass relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
            <Sparkles size={15} />
          </span>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI Insight</h3>
          <span className="ml-auto rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-500">
            Gemini
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[90, 80, 95, 60].map((w, i) => (
              <motion.div
                key={i}
                className="h-3 rounded bg-black/[0.06] dark:bg-white/[0.08]"
                style={{ width: `${w}%` }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        ) : text ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {text}
          </p>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Tap “Generate insight” to get a fresh AI summary of your week.
          </p>
        )}
      </div>
    </div>
  );
}
