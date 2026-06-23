import { catColor } from "../lib/colors";

export function CategoryChips({
  categories,
  active,
  onToggle,
  onClear,
}: {
  categories: string[];
  active: Set<string>;
  onToggle: (c: string) => void;
  onClear: () => void;
}) {
  if (categories.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onClear}
        className={`pill ${active.size === 0 ? "pill-active" : "pill-idle"}`}
      >
        All
      </button>
      {categories.map((c) => {
        const on = active.has(c);
        return (
          <button
            key={c}
            onClick={() => onToggle(c)}
            className={`pill inline-flex items-center gap-1.5 ${on ? "pill-active" : "pill-idle"}`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: catColor(c), opacity: on ? 1 : 0.7 }}
            />
            {c}
          </button>
        );
      })}
    </div>
  );
}
