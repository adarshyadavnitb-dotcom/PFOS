import { motion } from "framer-motion";
import { CatSlice } from "../lib/aggregate";
import { catColor } from "../lib/colors";
import { inrCompact } from "../lib/format";
import { EmptyChart } from "./ChartTooltip";

const RADII = [70, 57, 44, 31, 18];
const STROKE = 9;
const CX = 80;
const CY = 80;

export function IncomeRings({
  cats,
  income,
}: {
  cats: CatSlice[];
  income: number;
}) {
  if (!income || cats.length === 0) return <EmptyChart message="Set your income to see rings" />;

  const top = cats.slice(0, 5);
  const totalSpend = top.reduce((s, c) => s + c.amount, 0);
  const totalPct = Math.min(Math.round((totalSpend / income) * 100), 100);

  return (
    <div className="flex items-center gap-6">
      {/* SVG rings */}
      <div className="relative shrink-0">
        <svg width={160} height={160} viewBox="0 0 160 160">
          {top.map((cat, i) => {
            const r = RADII[i];
            const circ = 2 * Math.PI * r;
            const pct = Math.min(cat.amount / income, 1);
            const color = catColor(cat.category, i);
            return (
              <g key={cat.category}>
                {/* Track */}
                <circle
                  cx={CX} cy={CY} r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={STROKE}
                />
                {/* Progress arc */}
                <motion.circle
                  cx={CX} cy={CY} r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  initial={{ strokeDashoffset: circ }}
                  whileInView={{ strokeDashoffset: circ * (1 - pct) }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: 0.15 + i * 0.18, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transform: "rotate(-90deg)", transformOrigin: `${CX}px ${CY}px` }}
                />
              </g>
            );
          })}

          {/* Center label */}
          <text
            x={CX} y={CY - 8}
            textAnchor="middle"
            fill="white"
            fontSize={22}
            fontWeight={800}
            fontFamily="inherit"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {totalPct}%
          </text>
          <text
            x={CX} y={CY + 12}
            textAnchor="middle"
            fill="rgba(148,163,184,0.7)"
            fontSize={9}
            fontWeight={600}
            letterSpacing={1}
            fontFamily="inherit"
          >
            OF INCOME
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2.5">
        {top.map((cat, i) => {
          const pct = Math.min(Math.round((cat.amount / income) * 100), 100);
          const color = catColor(cat.category, i);
          return (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  {cat.category}
                </span>
                <span className="tabular-nums text-[11px] font-bold text-slate-300">
                  {pct}%
                  <span className="ml-1 font-normal text-slate-600">·</span>
                  <span className="ml-1 font-normal text-slate-500">{inrCompact(cat.amount)}</span>
                </span>
              </div>
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </motion.div>
          );
        })}

        <div className="pt-1 text-[10px] text-slate-600">
          {inrCompact(totalSpend)} of {inrCompact(income)} income allocated
        </div>
      </div>
    </div>
  );
}
