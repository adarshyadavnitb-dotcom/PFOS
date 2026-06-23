import { RangeKey, Txn } from "../types";
import { parseDate, shortDate } from "./format";

export function rangeStart(range: RangeKey, now = new Date()): Date {
  const d = new Date(now);
  if (range === "today") {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "week") {
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "month") {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  return new Date(0); // all
}

export function filterByRange(txns: Txn[], range: RangeKey, now = new Date()): Txn[] {
  const start = rangeStart(range, now).getTime();
  // "month" uses end-of-calendar-month so pre-logged future entries in the same month are included.
  // "all" has no upper bound. "today"/"week" cap at now.
  const end =
    range === "month"
      ? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime()
      : range === "all"
      ? Infinity
      : now.getTime() + 1;
  return txns.filter((t) => {
    const ms = parseDate(t.date).getTime();
    return !isNaN(ms) && ms >= start && ms <= end;
  });
}

export function applyCategoryFilter(txns: Txn[], active: Set<string>): Txn[] {
  if (active.size === 0) return txns;
  return txns.filter((t) => active.has(t.category));
}

const sum = (txns: Txn[]) => txns.reduce((s, t) => s + (t.amount || 0), 0);

export interface Kpis {
  totalSpend: number;
  txnCount: number;
  savingsRate: number;
  topCategory: string;
  needPct: number;
}

export function computeKpis(allTxns: Txn[], filtered: Txn[], income: number, now = new Date()): Kpis {
  const totalSpend = sum(filtered);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthSpend = sum(
    allTxns.filter((t) => {
      const ms = parseDate(t.date).getTime();
      return !isNaN(ms) && ms >= monthStart;
    })
  );
  const savingsRate = income > 0 ? Math.round(((income - monthSpend) / income) * 100) : 0;

  const cats = categoryBreakdown(filtered);
  const topCategory = cats.length ? cats[0].category : "—";

  const needTotal = sum(filtered.filter((t) => (t.need_or_want || "").toLowerCase() === "need"));
  const needPct = totalSpend > 0 ? Math.round((needTotal / totalSpend) * 100) : 0;

  return { totalSpend, txnCount: filtered.length, savingsRate, topCategory, needPct };
}

export interface CatSlice {
  category: string;
  amount: number;
}

export function categoryBreakdown(txns: Txn[]): CatSlice[] {
  const m = new Map<string, number>();
  for (const t of txns) {
    const c = t.category || "Other";
    m.set(c, (m.get(c) || 0) + (t.amount || 0));
  }
  return [...m.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function needWantSplit(txns: Txn[]): { need: number; want: number } {
  let need = 0,
    want = 0;
  for (const t of txns) {
    if ((t.need_or_want || "").toLowerCase() === "need") need += t.amount || 0;
    else want += t.amount || 0;
  }
  return { need, want };
}

export function topMerchants(txns: Txn[], n = 5): CatSlice[] {
  const m = new Map<string, number>();
  for (const t of txns) {
    const k = t.merchant || "Unknown";
    m.set(k, (m.get(k) || 0) + (t.amount || 0));
  }
  return [...m.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

export interface SeriesPoint {
  label: string;
  amount: number;
}

// Buckets spend over time at a granularity appropriate to the range.
export function spendSeries(txns: Txn[], range: RangeKey): SeriesPoint[] {
  if (txns.length === 0) return [];

  if (range === "today") {
    // hourly buckets
    const buckets = new Array(24).fill(0);
    for (const t of txns) {
      const d = parseDate(t.date);
      if (!isNaN(d.getTime())) buckets[d.getHours()] += t.amount || 0;
    }
    return buckets.map((amount, h) => ({ label: `${h}:00`, amount })).filter((_, i) => i >= 6);
  }

  const byMonth = range === "all";
  const map = new Map<string, { label: string; amount: number; sort: number }>();
  for (const t of txns) {
    const d = parseDate(t.date);
    if (isNaN(d.getTime())) continue;
    let key: string, label: string, srt: number;
    if (byMonth) {
      key = `${d.getFullYear()}-${d.getMonth()}`;
      label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      srt = d.getFullYear() * 12 + d.getMonth();
    } else {
      key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      label = shortDate(d);
      srt = d.getTime();
    }
    const cur = map.get(key);
    if (cur) cur.amount += t.amount || 0;
    else map.set(key, { label, amount: t.amount || 0, sort: srt });
  }
  return [...map.values()].sort((a, b) => a.sort - b.sort).map(({ label, amount }) => ({ label, amount }));
}
