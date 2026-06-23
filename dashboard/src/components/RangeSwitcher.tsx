import { RangeKey } from "../types";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "all", label: "All" },
];

export function RangeSwitcher({ value, onChange }: { value: RangeKey; onChange: (r: RangeKey) => void }) {
  return (
    <div className="inline-flex gap-1 rounded-full border border-black/[0.06] bg-white/50 p-1 dark:border-white/10 dark:bg-white/[0.04]">
      {RANGES.map((r) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          className={`pill ${value === r.key ? "pill-active" : "pill-idle"}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
