"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/lib/budget/budget-context";

type Bucket = { label: string; total: number; dateStr?: string; key?: string };
type Range = 7 | 30 | 365;

const W = 800;
const H = 140;
const PAD_L = 42;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 28;
const CHART_W = W - PAD_L - PAD_R;
const CHART_H = H - PAD_T - PAD_B;
const MS_DAY = 86400000;

export function TrendChart() {
  const { transactions } = useBudget();
  const [range, setRange] = useState<Range>(7);

  const buckets = useMemo<Bucket[]>(() => {
    const now = new Date();
    const result: Bucket[] = [];

    if (range === 7) {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * MS_DAY);
        result.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), total: 0, dateStr: d.toISOString().split("T")[0] });
      }
      transactions
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const b = result.find((b) => b.dateStr === t.date);
          if (b) b.total += t.amount;
        });
    } else if (range === 30) {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * MS_DAY);
        const dateStr = d.toISOString().split("T")[0];
        const label = i % 5 === 0 ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
        result.push({ label, total: 0, dateStr });
      }
      transactions
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const b = result.find((b) => b.dateStr === t.date);
          if (b) b.total += t.amount;
        });
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        result.push({ label: d.toLocaleDateString("en-US", { month: "short" }), total: 0, key });
      }
      transactions
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const key = t.date.substring(0, 7);
          const b = result.find((b) => b.key === key);
          if (b) b.total += t.amount;
        });
    }

    return result;
  }, [transactions, range]);

  const maxVal = Math.max(...buckets.map((b) => b.total), 0.01);
  const hasData = buckets.some((b) => b.total > 0);
  const n = buckets.length;

  const pts = buckets.map((b, i) => ({
    x: PAD_L + (i / (n - 1)) * CHART_W,
    y: PAD_T + CHART_H - (b.total / maxVal) * CHART_H,
    total: b.total,
    label: b.label,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fillPath = pts.length
    ? `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(PAD_T + CHART_H).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD_T + CHART_H).toFixed(1)} Z`
    : "";

  const yTicks = [0, 0.5, 1].map((frac) => ({ y: PAD_T + CHART_H - frac * CHART_H, val: (frac * maxVal).toFixed(0) }));

  return (
    <div className="planner-card" style={{ marginBottom: 20 }}>
      <div className="planner-card-header">
        <div className="planner-card-title">📈 Spending Trend</div>
        <div style={{ display: "flex", gap: 4 }}>
          {([7, 30, 365] as const).map((r) => (
            <button
              key={r}
              className={range === r ? "btn btn-primary" : "btn btn-ghost"}
              style={{ fontSize: "0.65rem", padding: "3px 10px" }}
              onClick={() => setRange(r)}
            >
              {r === 365 ? "1y" : `${r}d`}
            </button>
          ))}
        </div>
      </div>
      <div className="planner-card-body" style={{ padding: "12px 16px 16px" }}>
        <div id="trendChartWrap">
          {hasData ? (
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="160" style={{ display: "block", overflow: "visible" }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              {yTicks.map((t, i) => (
                <line key={i} x1={PAD_L} y1={t.y} x2={W - PAD_R} y2={t.y} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,3" />
              ))}
              {yTicks.map((t, i) => (
                <text key={i} x={PAD_L - 5} y={t.y + 4} fontFamily="var(--font-mono)" fontSize={9} fill="var(--text3)" textAnchor="end">
                  ${t.val}
                </text>
              ))}
              {pts
                .filter((p) => p.label)
                .map((p, i) => (
                  <text
                    key={i}
                    x={p.x}
                    y={PAD_T + CHART_H + 14}
                    fontFamily="var(--font-mono)"
                    fontSize={9}
                    fill="var(--text3)"
                    textAnchor="middle"
                  >
                    {p.label}
                  </text>
                ))}
              <path d={fillPath} fill="url(#trendFill)" />
              <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {pts
                .filter((p) => p.total > 0)
                .map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--accent)" stroke="var(--bg2)" strokeWidth={1.5}>
                    <title>${p.total.toFixed(2)}</title>
                  </circle>
                ))}
            </svg>
          ) : (
            <div
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.78rem",
                color: "var(--text3)",
                textAlign: "center",
                padding: "40px 0",
              }}
            >
              No expense data for this period.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
