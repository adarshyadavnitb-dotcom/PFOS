import { inr } from "../lib/format";

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const name = payload[0]?.payload?.name ?? label;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-xl border border-black/10 bg-white/90 px-3 py-2 text-xs shadow-xl backdrop-blur-md dark:border-white/15 dark:bg-slate-900/90">
      {name != null && <div className="font-semibold text-slate-700 dark:text-slate-200">{name}</div>}
      <div className="text-slate-500 dark:text-slate-400">{inr(value)}</div>
    </div>
  );
}

export function EmptyChart({ message = "No data in this range" }: { message?: string }) {
  return (
    <div className="grid h-full min-h-[180px] place-items-center text-sm text-slate-400 dark:text-slate-500">
      {message}
    </div>
  );
}
