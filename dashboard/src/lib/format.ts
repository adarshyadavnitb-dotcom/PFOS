const inrFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function inr(n: number): string {
  return "₹" + inrFmt.format(Math.round(n || 0));
}

export function inrCompact(n: number): string {
  const v = Math.round(n || 0);
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(1) + "Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(1) + "L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(1) + "k";
  return "₹" + v;
}

export function parseDate(s: string): Date {
  return new Date((s || "").trim());
}

export function shortDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
