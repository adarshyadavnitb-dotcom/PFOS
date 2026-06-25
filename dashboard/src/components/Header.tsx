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
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500 shadow-[0_2px_12px_-2px_rgba(0,122,255,0.45)]">
          <span className="text-lg font-extrabold text-white">₹</span>
        </div>
        <div>
          <h1 className="text-[1.1rem] font-extrabold tracking-tight text-slate-800 dark:text-white">
            PFOS Wealth Dashboard
          </h1>
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Personal Finance Operating System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className={`pill flex items-center gap-1.5 ${
            mode === "live"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${mode === "live" ? "bg-emerald-500" : "bg-amber-500"}`} />
          {mode === "live" ? "Live data" : "Demo data"}
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
