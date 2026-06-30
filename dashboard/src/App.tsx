import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Wallet, Receipt, PiggyBank, Tag, Scale, Loader2, AlertCircle, CalendarDays } from "lucide-react";

import { ApiData, NewExpense, RangeKey, Txn } from "./types";
import { DEMO_DATA } from "./demoData";
import { addExpense, ApiError, fetchData, generateInsight } from "./api";
import {
  applyCategoryFilter,
  categoryBreakdown,
  computeKpis,
  budgetStatus,
  cashflowCalendarStatus,
  filterByRange,
  monthlyBudgets,
  monthOverMonth,
  needWantSplit,
  safeToSpendStatus,
  spendPaceSeries,
  spendSeries,
  topMerchants,
} from "./lib/aggregate";
import { inr } from "./lib/format";

import { Header } from "./components/Header";
import { RangeSwitcher } from "./components/RangeSwitcher";
import { CategoryChips } from "./components/CategoryChips";
import { KpiCard } from "./components/KpiCard";
import { Card } from "./components/Card";
import { SpendTrendChart } from "./components/SpendTrendChart";
import { CategoryDonut } from "./components/CategoryDonut";
import { NeedWantBar } from "./components/NeedWantBar";
import { TopMerchants } from "./components/TopMerchants";
import { BudgetVsActual } from "./components/BudgetVsActual";
import { SafeToSpend } from "./components/SafeToSpend";
import { CashflowCalendar } from "./components/CashflowCalendar";
import { InsightCard } from "./components/InsightCard";
import { MonthComparison } from "./components/MonthComparison";
import { SpendPaceChart } from "./components/SpendPaceChart";
import { ActionBar } from "./components/ActionBar";
import { QuickAddModal } from "./components/QuickAddModal";
import { ConnectModal } from "./components/ConnectModal";
import { Toast, ToastState } from "./components/Toast";

const TOKEN_KEY = "pfos_token";
const THEME_KEY = "pfos_theme";
const RANGE_LABEL: Record<RangeKey, string> = { today: "today", week: "this week", month: "this month", all: "all time" };

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem(THEME_KEY) as "dark" | "light") || "dark"
  );
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();

  const [range, setRange] = useState<RangeKey>("month");
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());

  const [showConnect, setShowConnect] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [insightText, setInsightText] = useState<string>();
  const [toast, setToast] = useState<ToastState | null>(null);

  const flash = (msg: string, kind: ToastState["kind"] = "success") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2800);
  };

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Initial load
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      loadLive(token);
    } else {
      setData(DEMO_DATA);
      setInsightText(DEMO_DATA.latest_weekly_insight);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLive(token: string) {
    setLoading(true);
    setLoadError(undefined);
    try {
      const d = await fetchData(token);
      setData(d);
      setInsightText(d.latest_weekly_insight);
      setMode("live");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
      // fall back to demo so the UI still renders
      setData(DEMO_DATA);
      setMode("demo");
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(token: string) {
    setConnecting(true);
    setConnectError(undefined);
    try {
      const d = await fetchData(token);
      localStorage.setItem(TOKEN_KEY, token);
      setData(d);
      setInsightText(d.latest_weekly_insight);
      setMode("live");
      setShowConnect(false);
      flash("Connected to your live data");
    } catch (e) {
      setConnectError(e instanceof ApiError ? e.message : "Could not connect");
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    localStorage.removeItem(TOKEN_KEY);
    setData(DEMO_DATA);
    setInsightText(DEMO_DATA.latest_weekly_insight);
    setMode("demo");
    flash("Switched to demo data");
  }

  async function handleAdd(e: NewExpense) {
    if (mode === "demo") {
      // local-only add for an interactive demo
      const now = new Date();
      const t: Txn = {
        date: now.toISOString(),
        amount: e.amount,
        merchant: e.merchant,
        category: e.category,
        need_or_want: e.need_or_want,
        month_key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      };
      setData((d) => (d ? { ...d, transactions: [...d.transactions, t] } : d));
      setShowAdd(false);
      flash(`Added ${inr(e.amount)} (demo)`);
      return;
    }
    setAdding(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY)!;
      await addExpense(token, e);
      await loadLive(token);
      setShowAdd(false);
      flash(`Logged ${inr(e.amount)} to your sheet`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to add", "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleGenerate() {
    if (mode === "demo") {
      setGenerating(true);
      setTimeout(() => {
        setInsightText(DEMO_DATA.latest_weekly_insight);
        setGenerating(false);
        flash("Showing demo insight — connect for live AI");
      }, 700);
      return;
    }
    setGenerating(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY)!;
      const res = await generateInsight(token);
      setInsightText(res.insight);
      flash("Fresh insight generated & sent to Telegram");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to generate", "error");
    } finally {
      setGenerating(false);
    }
  }

  const income = data?.monthly_income ?? 0;
  const allTxns = data?.transactions ?? [];

  const byRange = useMemo(() => filterByRange(allTxns, range), [allTxns, range]);
  const presentCats = useMemo(
    () => [...new Set(byRange.map((t) => t.category))].sort(),
    [byRange]
  );
  const filtered = useMemo(() => applyCategoryFilter(byRange, activeCats), [byRange, activeCats]);
  const kpis = useMemo(() => computeKpis(allTxns, filtered, income), [allTxns, filtered, income]);
  const series = useMemo(() => spendSeries(filtered, range), [filtered, range]);
  const cats = useMemo(() => categoryBreakdown(filtered), [filtered]);
  const nw = useMemo(() => needWantSplit(filtered), [filtered]);
  const merchants = useMemo(() => topMerchants(filtered, 5), [filtered]);
  const budgets = useMemo(() => monthlyBudgets(data?.budgets, income), [data?.budgets, income]);
  const budget = useMemo(() => budgetStatus(allTxns, budgets), [allTxns, budgets]);
  const safeToSpend = useMemo(() => safeToSpendStatus(budget), [budget]);
  const cashflow = useMemo(() => cashflowCalendarStatus(allTxns, budget, income), [allTxns, budget, income]);
  const mom = useMemo(() => monthOverMonth(allTxns), [allTxns]);
  const pace = useMemo(() => spendPaceSeries(allTxns), [allTxns]);

  function toggleCat(c: string) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="animate-spin" /> Loading your dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <Header
        mode={mode}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onConnect={() => {
          setConnectError(undefined);
          setShowConnect(true);
        }}
        onDisconnect={handleDisconnect}
      />

      {loadError && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
          <AlertCircle size={16} /> {loadError} — showing demo data instead.
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <RangeSwitcher value={range} onChange={setRange} />
        <ActionBar onAdd={() => setShowAdd(true)} onGenerate={handleGenerate} generating={generating} />
      </div>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Spent" value={inr(kpis.totalSpend)} sub={RANGE_LABEL[range]}
          icon={<Wallet size={17} />} accent="blue" delay={0.02}
          trend={mom.prevMonthTotal > 0 ? {
            label: `${mom.deltaPct > 0 ? "+" : ""}${mom.deltaPct}% vs ${mom.prevMonthLabel}`,
            positive: mom.deltaPct <= 0,
          } : undefined}
        />
        <KpiCard label="Transactions" value={String(kpis.txnCount)} sub={RANGE_LABEL[range]} icon={<Receipt size={17} />} accent="indigo" delay={0.06}
          trend={mom.prevMonthCount > 0 ? {
            label: `${mom.thisMonthCount - mom.prevMonthCount > 0 ? "+" : ""}${mom.thisMonthCount - mom.prevMonthCount} vs ${mom.prevMonthLabel}`,
            positive: mom.thisMonthCount <= mom.prevMonthCount,
          } : undefined}
        />
        <KpiCard label="Savings rate" value={`${kpis.savingsRate}%`} sub={`on ${inr(income)} / mo`} icon={<PiggyBank size={17} />} accent="emerald" delay={0.1} />
        <KpiCard label="Top category" value={kpis.topCategory} sub={RANGE_LABEL[range]} icon={<Tag size={17} />} accent="amber" delay={0.14} />
        <KpiCard label="Needs share" value={`${kpis.needPct}%`} sub="of spend" icon={<Scale size={17} />} accent="rose" delay={0.18} />
        <KpiCard label="Safe / day" value={inr(safeToSpend.dailySafeSpend)} sub={`${safeToSpend.daysRemaining} days left`} icon={<CalendarDays size={17} />} accent="emerald" delay={0.22} />
      </div>

      {/* Category filter */}
      <div className="mb-5">
        <CategoryChips categories={presentCats} active={activeCats} onToggle={toggleCat} onClear={() => setActiveCats(new Set())} />
      </div>

      {/* Month Comparison + Spend Pace */}
      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card title="This month vs last month" subtitle={`${mom.thisMonthLabel} compared to ${mom.prevMonthLabel}`} delay={0.04}>
          <MonthComparison status={mom} />
        </Card>
        <Card title="Spending pace" subtitle="cumulative spend — this month vs last month" delay={0.07}>
          <SpendPaceChart
            data={pace}
            thisLabel={mom.thisMonthLabel}
            prevLabel={mom.prevMonthLabel}
            today={new Date().getDate()}
          />
          <div className="mt-3 flex items-center gap-5 text-[10px] font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-5 rounded-full bg-blue-500" />
              {mom.thisMonthLabel} (this month)
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-0.5 w-5 rounded-full bg-slate-400"
                style={{ background: "repeating-linear-gradient(90deg, rgb(148 163 184) 0 4px, transparent 4px 7px)" }}
              />
              {mom.prevMonthLabel} (last month)
            </span>
          </div>
        </Card>
      </div>

      {/* Trend + Insight */}
      <div className="mb-5 grid gap-4 lg:grid-cols-4">
        <Card title="Spending over time" subtitle={RANGE_LABEL[range]} className="lg:col-span-2" delay={0.05}>
          <SpendTrendChart data={series} />
        </Card>
        <Card title="Safe to spend" subtitle="this month" delay={0.08}>
          <SafeToSpend status={safeToSpend} />
        </Card>
        <InsightCard text={insightText} loading={generating} />
      </div>

      <div className="mb-5">
        <Card title="Cashflow calendar" subtitle="monthly runway" delay={0.06}>
          <CashflowCalendar status={cashflow} />
        </Card>
      </div>

      {/* Breakdown row */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card title="By category" delay={0.05}>
          <CategoryDonut data={cats} />
        </Card>
        <Card title="Budget vs Actual" subtitle="this month" delay={0.1}>
          <BudgetVsActual status={budget} />
        </Card>
        <Card title="Needs vs Wants" delay={0.1}>
          <NeedWantBar need={nw.need} want={nw.want} />
        </Card>
        <Card title="Top merchants" delay={0.15}>
          <TopMerchants data={merchants} />
        </Card>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
        PFOS · Telegram → n8n → Gemini → Google Sheets · {mode === "demo" ? "Demo dataset" : "Live data"}
      </footer>

      <AnimatePresence>
        {showConnect && (
          <ConnectModal
            onClose={() => setShowConnect(false)}
            onSubmit={handleConnect}
            connecting={connecting}
            error={connectError}
          />
        )}
        {showAdd && <QuickAddModal onClose={() => setShowAdd(false)} onSubmit={handleAdd} submitting={adding} />}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  );
}
