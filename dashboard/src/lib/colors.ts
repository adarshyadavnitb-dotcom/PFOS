export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#f59e0b",
  Transport: "#06b6d4",
  Groceries: "#22c55e",
  Shopping: "#ec4899",
  Entertainment: "#8b5cf6",
  Health: "#ef4444",
  Utilities: "#3b82f6",
  Education: "#14b8a6",
  "Personal Care": "#f472b6",
  Other: "#94a3b8",
  Uncategorized: "#64748b",
};

const FALLBACK = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b", "#22c55e", "#3b82f6", "#ef4444", "#14b8a6"];

export function catColor(c: string, i = 0): string {
  return CATEGORY_COLORS[c] || FALLBACK[i % FALLBACK.length];
}
