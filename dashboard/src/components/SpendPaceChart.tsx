import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PacePoint } from "../lib/aggregate";
import { inr, inrCompact } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

function PaceTooltip({
  active,
  payload,
  label,
  thisLabel,
  prevLabel,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: number;
  thisLabel: string;
  prevLabel: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/90 px-3 py-2 text-xs shadow-lg backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90">
      <div className="mb-1 font-semibold text-slate-500">Day {label}</div>
      {payload.map((p: { dataKey: string; color: string; value: number }) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600 dark:text-slate-300">
            {p.dataKey === "thisMonth" ? thisLabel : prevLabel}:
          </span>
          <span className="font-bold text-slate-800 dark:text-white">{inr(p.value ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}

export function SpendPaceChart({
  data,
  thisLabel,
  prevLabel,
  today,
}: {
  data: PacePoint[];
  thisLabel: string;
  prevLabel: string;
  today: number;
}) {
  if (data.length === 0) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.10)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "rgb(148 163 184)" }}
          axisLine={false}
          tickLine={false}
          tickCount={8}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "rgb(148 163 184)" }}
          axisLine={false}
          tickLine={false}
          width={52}
          tickFormatter={(v) => inrCompact(v)}
        />
        <Tooltip content={(props) => <PaceTooltip active={props.active} payload={props.payload} label={props.label as number} thisLabel={thisLabel} prevLabel={prevLabel} />} />
        {/* "today" reference line */}
        <ReferenceLine
          x={today}
          stroke="rgba(0,122,255,0.35)"
          strokeDasharray="4 3"
          label={{ value: "today", position: "top", fontSize: 9, fill: "rgb(148 163 184)" }}
        />
        {/* Previous month — dashed gray */}
        <Line
          type="monotone"
          dataKey="prevMonth"
          stroke="rgba(148,163,184,0.5)"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="5 3"
          name="prevMonth"
          connectNulls
        />
        {/* This month — solid blue, stops at today */}
        <Line
          type="monotone"
          dataKey="thisMonth"
          stroke="#007aff"
          strokeWidth={2.5}
          dot={false}
          name="thisMonth"
          connectNulls={false}
          activeDot={{ r: 5, fill: "#007aff", stroke: "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
