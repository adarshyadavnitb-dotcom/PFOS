import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { MonthlySavingsPoint } from "../lib/aggregate";
import { inr, inrCompact } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

function SavingsTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-slate-950/95 px-4 py-3 text-xs shadow-2xl">
      <div className="mb-1.5 font-bold text-white">{label}</div>
      <div className="tabular-nums font-extrabold text-emerald-400">{inr(item.value)}</div>
      <div className="mt-0.5 text-slate-500">saved this month</div>
    </div>
  );
}

export function SavingsTrendChart({ data }: { data: MonthlySavingsPoint[] }) {
  if (data.length === 0) return <EmptyChart />;

  const avgRate = Math.round(data.reduce((s, p) => s + p.savingsRate, 0) / data.length);
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const trend = prev ? latest.savingsRate - prev.savingsRate : 0;
  const isImproving = trend >= 0;
  const aboveAvg = latest.savingsRate >= avgRate;

  const chips = [
    { label: "6-mo avg", value: `${avgRate}%`, color: "neutral" },
    { label: "This month", value: `${latest.savingsRate}%`, color: aboveAvg ? "green" : "red" },
    { label: "vs last month", value: `${trend >= 0 ? "+" : ""}${trend}pp`, color: isImproving ? "green" : "red" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Stat chips — Double-Bezel */}
      <div className="grid grid-cols-3 gap-2">
        {chips.map((chip, i) => (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-[1px]"
            style={{
              background:
                chip.color === "green"
                  ? "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.04))"
                  : chip.color === "red"
                  ? "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.03))"
                  : "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
            }}
          >
            <div className="rounded-[14px] bg-slate-950/80 px-2.5 py-2.5">
              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-1.5">
                {chip.label}
              </div>
              <div
                className="text-xl font-extrabold leading-none tabular-nums"
                style={{
                  color:
                    chip.color === "green"
                      ? "#4ade80"
                      : chip.color === "red"
                      ? "#f87171"
                      : "#e2e8f0",
                }}
              >
                {chip.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Savings amount area chart */}
      <ResponsiveContainer width="100%" height={152}>
        <AreaChart data={data} margin={{ top: 6, right: 2, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="savGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.38} />
              <stop offset="65%" stopColor="#22c55e" stopOpacity={0.07} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 5" stroke="rgba(148,163,184,0.07)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "rgba(148,163,184,0.6)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "rgba(148,163,184,0.6)" }}
            axisLine={false}
            tickLine={false}
            width={42}
            tickFormatter={inrCompact}
          />
          <Tooltip content={<SavingsTooltip />} cursor={{ stroke: "rgba(34,197,94,0.2)", strokeWidth: 1.5 }} />
          <Area
            type="monotone"
            dataKey="savings"
            stroke="#22c55e"
            strokeWidth={2.5}
            fill="url(#savGrad2)"
            dot={false}
            activeDot={{ r: 4, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Savings rate sparkline — inline dots */}
      <div>
        <div className="mb-2 flex items-center justify-between text-[10px]">
          <span className="font-semibold text-slate-500 uppercase tracking-[0.12em]">Rate by month</span>
          <span className="tabular-nums text-slate-600">{avgRate}% avg</span>
        </div>
        <div className="flex items-end gap-1">
          {data.map((p, i) => {
            const h = Math.max(4, (p.savingsRate / 100) * 36);
            const isLast = i === data.length - 1;
            return (
              <motion.div
                key={p.month}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: h, transformOrigin: "bottom" }}
                className={`flex-1 rounded-t-[3px] transition-colors ${
                  isLast
                    ? p.savingsRate >= avgRate
                      ? "bg-emerald-400"
                      : "bg-rose-400"
                    : "bg-white/[0.12]"
                }`}
                title={`${p.month}: ${p.savingsRate}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Trend footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="rounded-2xl p-[1px]"
        style={{
          background: isImproving
            ? "linear-gradient(90deg, rgba(34,197,94,0.2), rgba(34,197,94,0.04))"
            : "linear-gradient(90deg, rgba(239,68,68,0.2), rgba(239,68,68,0.04))",
        }}
      >
        <div
          className={`flex items-center gap-2 rounded-[14px] bg-slate-950/80 px-3.5 py-2.5 text-[11px] font-medium ${
            isImproving ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {isImproving ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>
            {isImproving ? "Savings improving" : "Savings declining"} — {trend >= 0 ? "+" : ""}
            {trend}pp vs last month
          </span>
        </div>
      </motion.div>
    </div>
  );
}
