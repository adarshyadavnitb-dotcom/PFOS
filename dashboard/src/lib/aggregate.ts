import { Budget, CATEGORIES, RangeKey, Txn } from "../types";
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

const DEFAULT_BUDGET_WEIGHTS: Record<string, number> = {
  "Food & Dining": 0.1,
  Transport: 0.05,
  Groceries: 0.09,
  Shopping: 0.07,
  Entertainment: 0.03,
  Health: 0.04,
  Utilities: 0.05,
  Education: 0.03,
  "Personal Care": 0.02,
  Other: 0.03,
};

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

export interface BudgetRow {
  category: string;
  budget: number;
  actual: number;
  remaining: number;
  usedPct: number;
}

export interface BudgetStatus {
  rows: BudgetRow[];
  totalBudget: number;
  totalActual: number;
  remaining: number;
  usedPct: number;
  pacePct: number;
  projectedSpend: number;
}

export interface SafeToSpendStatus {
  dailySafeSpend: number;
  daysRemaining: number;
  monthRemaining: number;
  projectedDelta: number;
  categoryToWatch?: BudgetRow;
}

export interface CashflowDay {
  date: string;
  day: number;
  weekday: number;
  spend: number;
  isToday: boolean;
  isFuture: boolean;
  isPayday: boolean;
  paceDelta: number;
}

export interface CashflowCalendarStatus {
  monthLabel: string;
  days: CashflowDay[];
  leadingBlanks: number;
  totalSpend: number;
  totalBudget: number;
  dailyBudget: number;
  income: number;
  projectedSpend: number;
  projectedSavings: number;
  highSpendDays: CashflowDay[];
}

export function monthlyBudgets(budgets: Budget[] | undefined, income: number): Budget[] {
  const explicit = (budgets || [])
    .map((b) => ({
      category: b.category || "Other",
      monthly_limit: Math.max(0, Number(b.monthly_limit) || 0),
    }))
    .filter((b) => b.monthly_limit > 0);

  if (explicit.length > 0) return explicit;

  return CATEGORIES.map((category) => ({
    category,
    monthly_limit: Math.round((income || 0) * (DEFAULT_BUDGET_WEIGHTS[category] || 0.02)),
  })).filter((b) => b.monthly_limit > 0);
}

export function budgetStatus(txns: Txn[], budgets: Budget[], now = new Date()): BudgetStatus {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthTxns = txns.filter((t) => {
    const ms = parseDate(t.date).getTime();
    return !isNaN(ms) && ms >= monthStart.getTime() && ms <= monthEnd.getTime();
  });

  const actualByCategory = new Map(categoryBreakdown(monthTxns).map((c) => [c.category, c.amount]));
  const budgetByCategory = new Map<string, number>();
  for (const b of budgets) {
    budgetByCategory.set(b.category, (budgetByCategory.get(b.category) || 0) + (b.monthly_limit || 0));
  }

  const categories = new Set([...budgetByCategory.keys(), ...actualByCategory.keys()]);
  const rows = [...categories]
    .map((category) => {
      const budget = budgetByCategory.get(category) || 0;
      const actual = actualByCategory.get(category) || 0;
      return {
        category,
        budget,
        actual,
        remaining: budget - actual,
        usedPct: budget > 0 ? Math.round((actual / budget) * 100) : actual > 0 ? 100 : 0,
      };
    })
    .sort((a, b) => {
      const aOver = a.remaining < 0 ? 1 : 0;
      const bOver = b.remaining < 0 ? 1 : 0;
      return bOver - aOver || b.usedPct - a.usedPct || b.actual - a.actual;
    });

  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const elapsedDays = now.getDate();
  const daysInMonth = monthEnd.getDate();
  const pacePct = Math.round((elapsedDays / daysInMonth) * 100);
  const projectedSpend = elapsedDays > 0 ? Math.round((totalActual / elapsedDays) * daysInMonth) : totalActual;

  return {
    rows,
    totalBudget,
    totalActual,
    remaining: totalBudget - totalActual,
    usedPct: totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0,
    pacePct,
    projectedSpend,
  };
}

export function safeToSpendStatus(status: BudgetStatus, now = new Date()): SafeToSpendStatus {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(daysInMonth - now.getDate() + 1, 1);
  const monthRemaining = Math.max(status.remaining, 0);
  const dailySafeSpend = Math.floor(monthRemaining / daysRemaining);
  const projectedDelta = status.totalBudget - status.projectedSpend;
  const categoryToWatch = status.rows.find((r) => r.remaining < 0) || status.rows.find((r) => r.usedPct > status.pacePct);

  return {
    dailySafeSpend,
    daysRemaining,
    monthRemaining,
    projectedDelta,
    categoryToWatch,
  };
}

export function cashflowCalendarStatus(
  txns: Txn[],
  budget: BudgetStatus,
  income: number,
  now = new Date()
): CashflowCalendarStatus {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyBudget = daysInMonth > 0 ? Math.round(budget.totalBudget / daysInMonth) : 0;
  const spendByDay = new Map<number, number>();

  for (const t of txns) {
    const d = parseDate(t.date);
    if (isNaN(d.getTime())) continue;
    if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) continue;
    const day = d.getDate();
    spendByDay.set(day, (spendByDay.get(day) || 0) + (t.amount || 0));
  }

  const todayKey = now.toDateString();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
    const spend = spendByDay.get(i + 1) || 0;
    return {
      date: d.toISOString(),
      day: i + 1,
      weekday: d.getDay(),
      spend,
      isToday: d.toDateString() === todayKey,
      isFuture: d.getTime() > now.getTime(),
      isPayday: i === 0 && income > 0,
      paceDelta: spend - dailyBudget,
    };
  });

  return {
    monthLabel: monthStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    days,
    leadingBlanks: monthStart.getDay(),
    totalSpend: budget.totalActual,
    totalBudget: budget.totalBudget,
    dailyBudget,
    income,
    projectedSpend: budget.projectedSpend,
    projectedSavings: income - budget.projectedSpend,
    highSpendDays: [...days]
      .filter((d) => d.spend > dailyBudget * 1.25)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 3),
  };
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

// ── Month-over-Month ──────────────────────────────────────────────────────────

export interface MoMCategory {
  category: string;
  thisMonth: number;
  prevMonth: number;
  delta: number;
  deltaPct: number;
}

export interface MoMStatus {
  thisMonthTotal: number;
  prevMonthTotal: number;
  delta: number;
  deltaPct: number;
  thisMonthCount: number;
  prevMonthCount: number;
  categories: MoMCategory[];
  thisMonthLabel: string;
  prevMonthLabel: string;
}

export function monthOverMonth(txns: Txn[], now = new Date()): MoMStatus {
  const thisYear = now.getFullYear();
  const thisMonthIdx = now.getMonth();
  const prevYear = thisMonthIdx === 0 ? thisYear - 1 : thisYear;
  const prevMonthIdx = thisMonthIdx === 0 ? 11 : thisMonthIdx - 1;

  const thisStart = new Date(thisYear, thisMonthIdx, 1).getTime();
  const thisEnd = new Date(thisYear, thisMonthIdx + 1, 0, 23, 59, 59, 999).getTime();
  const prevStart = new Date(prevYear, prevMonthIdx, 1).getTime();
  const prevEnd = new Date(prevYear, prevMonthIdx + 1, 0, 23, 59, 59, 999).getTime();

  const thisTxns = txns.filter((t) => { const ms = parseDate(t.date).getTime(); return !isNaN(ms) && ms >= thisStart && ms <= thisEnd; });
  const prevTxns = txns.filter((t) => { const ms = parseDate(t.date).getTime(); return !isNaN(ms) && ms >= prevStart && ms <= prevEnd; });

  const thisTotal = sum(thisTxns);
  const prevTotal = sum(prevTxns);
  const delta = thisTotal - prevTotal;
  const deltaPct = prevTotal > 0 ? Math.round((delta / prevTotal) * 100) : 0;

  const thisByCat = new Map(categoryBreakdown(thisTxns).map((c) => [c.category, c.amount]));
  const prevByCat = new Map(categoryBreakdown(prevTxns).map((c) => [c.category, c.amount]));
  const allCats = new Set([...thisByCat.keys(), ...prevByCat.keys()]);

  const categories: MoMCategory[] = [...allCats]
    .map((category) => {
      const thisMonth = thisByCat.get(category) ?? 0;
      const prevMonth = prevByCat.get(category) ?? 0;
      const d = thisMonth - prevMonth;
      const dp = prevMonth > 0 ? Math.round((d / prevMonth) * 100) : thisMonth > 0 ? 100 : 0;
      return { category, thisMonth, prevMonth, delta: d, deltaPct: dp };
    })
    .sort((a, b) => b.thisMonth - a.thisMonth);

  return {
    thisMonthTotal: thisTotal,
    prevMonthTotal: prevTotal,
    delta,
    deltaPct,
    thisMonthCount: thisTxns.length,
    prevMonthCount: prevTxns.length,
    categories,
    thisMonthLabel: new Date(thisYear, thisMonthIdx, 1).toLocaleDateString("en-IN", { month: "short" }),
    prevMonthLabel: new Date(prevYear, prevMonthIdx, 1).toLocaleDateString("en-IN", { month: "short" }),
  };
}

// ── Spend Pace (cumulative day-by-day) ───────────────────────────────────────

export interface PacePoint {
  day: number;
  thisMonth: number | null; // null for days beyond today
  prevMonth: number;
}

export function spendPaceSeries(txns: Txn[], now = new Date()): PacePoint[] {
  const thisYear = now.getFullYear();
  const thisMonthIdx = now.getMonth();
  const prevYear = thisMonthIdx === 0 ? thisYear - 1 : thisYear;
  const prevMonthIdx = thisMonthIdx === 0 ? 11 : thisMonthIdx - 1;
  const daysInPrevMonth = new Date(thisYear, thisMonthIdx, 0).getDate();
  const today = now.getDate();

  const thisSpend = new Map<number, number>();
  const prevSpend = new Map<number, number>();

  for (const t of txns) {
    const d = parseDate(t.date);
    if (isNaN(d.getTime())) continue;
    if (d.getFullYear() === thisYear && d.getMonth() === thisMonthIdx) {
      const day = d.getDate();
      thisSpend.set(day, (thisSpend.get(day) ?? 0) + (t.amount || 0));
    } else if (d.getFullYear() === prevYear && d.getMonth() === prevMonthIdx) {
      const day = d.getDate();
      prevSpend.set(day, (prevSpend.get(day) ?? 0) + (t.amount || 0));
    }
  }

  const points: PacePoint[] = [];
  let thisCum = 0, prevCum = 0;
  for (let day = 1; day <= daysInPrevMonth; day++) {
    prevCum += prevSpend.get(day) ?? 0;
    if (day <= today) {
      thisCum += thisSpend.get(day) ?? 0;
      points.push({ day, thisMonth: thisCum, prevMonth: prevCum });
    } else {
      points.push({ day, thisMonth: null, prevMonth: prevCum });
    }
  }
  return points;
}

// ── Category Trend (last N months, stacked) ──────────────────────────────────

export interface CategoryTrendPoint {
  month: string;
  sort: number;
  [category: string]: number | string;
}

export interface CategoryTrendData {
  points: CategoryTrendPoint[];
  topCategories: string[];
}

export function categoryTrend(txns: Txn[], numMonths = 6, now = new Date()): CategoryTrendData {
  // Build map: "YYYY-M" → { category → amount }
  const monthMap = new Map<string, { label: string; sort: number; cats: Map<string, number> }>();

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    monthMap.set(key, { label, sort: d.getFullYear() * 12 + d.getMonth(), cats: new Map() });
  }

  for (const t of txns) {
    const d = parseDate(t.date);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const entry = monthMap.get(key);
    if (!entry) continue;
    const cat = t.category || "Other";
    entry.cats.set(cat, (entry.cats.get(cat) ?? 0) + (t.amount || 0));
  }

  // Find top 5 categories by total spend across all months
  const totals = new Map<string, number>();
  for (const { cats } of monthMap.values()) {
    for (const [cat, amt] of cats) totals.set(cat, (totals.get(cat) ?? 0) + amt);
  }
  const topCategories = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);

  const points: CategoryTrendPoint[] = [...monthMap.values()]
    .sort((a, b) => a.sort - b.sort)
    .map(({ label, sort, cats }) => {
      const pt: CategoryTrendPoint = { month: label, sort };
      for (const cat of topCategories) pt[cat] = cats.get(cat) ?? 0;
      return pt;
    });

  return { points, topCategories };
}

// ── Day-of-Week Pattern ───────────────────────────────────────────────────────

export interface DowPoint {
  day: string;
  dayIndex: number;
  total: number;
  count: number;
  avg: number;
}

export function dayOfWeekPattern(txns: Txn[], numMonths = 3, now = new Date()): DowPoint[] {
  const cutoff = new Date(now.getFullYear(), now.getMonth() - numMonths, 1).getTime();
  const totals = new Array(7).fill(0);
  const counts = new Array(7).fill(0);

  for (const t of txns) {
    const d = parseDate(t.date);
    if (isNaN(d.getTime()) || d.getTime() < cutoff) continue;
    const dow = d.getDay(); // 0=Sun
    totals[dow] += t.amount || 0;
    counts[dow]++;
  }

  // Return Mon–Sun order
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon first
  return ORDER.map((i) => ({
    day: DAYS[i],
    dayIndex: i,
    total: Math.round(totals[i]),
    count: counts[i],
    avg: counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
  }));
}

// ── Monthly Savings Trend ─────────────────────────────────────────────────────

export interface MonthlySavingsPoint {
  month: string;
  sort: number;
  spend: number;
  savings: number;
  savingsRate: number;
}

export function monthlySavingsTrend(txns: Txn[], income: number, numMonths = 6, now = new Date()): MonthlySavingsPoint[] {
  const points: MonthlySavingsPoint[] = [];

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const spend = txns
      .filter((t) => { const ms = parseDate(t.date).getTime(); return !isNaN(ms) && ms >= start && ms <= end; })
      .reduce((s, t) => s + (t.amount || 0), 0);
    const savings = Math.max(income - spend, 0);
    const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
    points.push({
      month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      sort: d.getFullYear() * 12 + d.getMonth(),
      spend: Math.round(spend),
      savings,
      savingsRate,
    });
  }

  return points;
}

// ── Top Merchants ─────────────────────────────────────────────────────────────

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
