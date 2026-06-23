import { Moon, Sun, Lock, Unlock } from "lucide-react";

type Mode = "demo" | "live";

export function Header({
  mode,
  theme,
  onToggleTheme,
  onConnect,
  onDisconnect,
}: {
  mode: Mode;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
          <span className="text-lg font-extrabold text-white">₹</span>
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            PFOS · Wealth Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personal Finance Operating System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className={`pill ${
            mode === "live"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          }`}
        >
          {mode === "live" ? "● Live data" : "● Demo data"}
        </span>

        {mode === "demo" ? (
          <button onClick={onConnect} className="btn-ghost">
            <Lock size={15} /> Connect my data
          </button>
        ) : (
          <button onClick={onDisconnect} className="btn-ghost">
            <Unlock size={15} /> Disconnect
          </button>
        )}

        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="grid h-10 w-10 place-items-center rounded-xl border border-black/[0.08] bg-white/50 text-slate-600 transition-all hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.1]"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
