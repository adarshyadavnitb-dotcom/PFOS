import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MonthlySavingsPoint } from "../lib/aggregate";
import { inr, inrCompact } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

function SavingsTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const rate = payload.find((p: any) => p.dataKey === "savingsRate");
  const savings = payload.find((p: any) => p.dataKey === "savings");
  const spend = payload.find((p: any) => p.dataKey === "spend");
  return (
    <div className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs shadow-xl dark:border-white/15 dark:bg-slate-900">
      <div className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{label}</div>
      {rate && <div className="text-emerald-600 dark:text-emerald-400">Savings rate: <span className="font-bold">{rate.value}%</span></div>}
      {savings && <div className="text-slate-500">Saved: {inr(savings.value)}</div>}
      {spend && <div className="text-slate-500">Spent: {inr(spend.value)}</div>}
    </div>
  );
}

export function SavingsTrendChart({ data }: { data: MonthlySavingsPoint[] }) {
  if (data.length === 0) return <EmptyChart />;

  const avgRate = Math.round(data.reduce((s, p) => s + p.savingsRate, 0) / data.length);
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const trend = prev ? latest.savingsRate - prev.savingsRate : 0;

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.04]">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">6-mo avg</div>
          <div className="mt-0.5 text-lg font-extrabold text-slate-800 dark:text-white">{avgRate}%</div>
        </div>
        <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.04]">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">This month</div>
          <div className={`mt-0.5 text-lg font-extrabold ${latest.savingsRate >= avgRate ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
            {latest.savingsRate}%
          </div>
        </div>
        {prev && (
          <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.04]">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">vs last month</div>
            <div className={`mt-0.5 text-lg font-extrabold ${trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
              {trend >= 0 ? "+" : ""}{trend}pp
            </div>
          </div>
        )}
      </div>

      {/* Dual chart: savings rate line + savings amount area */}
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.10)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgb(148 163 184)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "rgb(148 163 184)" }} axisLine={false} tickLine={false} width={48} tickFormatter={inrCompact} />
          <Tooltip content={<SavingsTooltip />} cursor={{ stroke: "rgba(34,197,94,0.3)", strokeWidth: 1.5 }} />
          <Area
            type="monotone"
            dataKey="savings"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#savingsFill)"
            dot={false}
            activeDot={{ r: 4, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Rate sparkline */}
      <div>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Savings rate % by month
        </div>
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <ReferenceLine y={avgRate} stroke="rgba(148,163,184,0.35)" strokeDasharray="4 3" />
            <Line
              type="monotone"
              dataKey="savingsRate"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3, fill: "#22c55e", stroke: "#fff", strokeWidth: 1.5 }}
              activeDot={{ r: 4 }}
            />
            <XAxis dataKey="month" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              formatter={(v: number) => [`${v}%`, "Savings rate"]}
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
          <span
            className="h-px w-6"
            style={{ background: "repeating-linear-gradient(90deg, rgb(148 163 184) 0 3px, transparent 3px 6px)" }}
          />
          <span>{avgRate}% average</span>
        </div>
      </div>
    </div>
  );
}
