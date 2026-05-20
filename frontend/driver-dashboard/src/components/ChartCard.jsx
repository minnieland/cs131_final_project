import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// CHART CARD
// Renders a live scrolling line chart for one metric (EAR, yaw, or pitch).
// Config for each metric lives in constants.js under CHART_CONFIGS.
//
// Props:
//   title       — display name
//   data        — array of { t, value, ts } from the data hook
//   color       — normal line color
//   dangerColor — line color when value crosses the threshold
//   refLine     — threshold value to draw the dashed reference line at
//   refLabel    — text label for the reference line
//   domain      — [min, max] for the Y axis
//   invertDanger— if true, danger = BELOW the refLine (used for EAR)

export function ChartCard({ title, data, color, dangerColor, refLine, domain, refLabel, invertDanger }) {
  const latest   = data[data.length - 1]?.value ?? 0;
  const isDanger = invertDanger ? latest < refLine : latest > refLine;

  const displayValue = typeof latest === "number"
    ? latest.toFixed(latest > 10 ? 1 : 3)
    : latest;

  return (
    <div style={{ border: "1px solid #1e293b", borderRadius: 6, padding: "12px 14px", background: "#0f172a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em" }}>
          {title.toUpperCase()}
        </div>
        <div style={{ fontSize: 11, color: isDanger ? dangerColor : color, fontWeight: 500 }}>
          {displayValue}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <XAxis dataKey="t" hide />
          <YAxis domain={domain} tick={{ fill: "#334155", fontSize: 9 }} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 4, fontSize: 11 }}
            labelStyle={{ color: "#475569" }}
            itemStyle={{ color }}
            formatter={v => [typeof v === "number" ? v.toFixed(3) : v]}
            labelFormatter={() => ""}
          />
          <ReferenceLine
            y={refLine}
            stroke={dangerColor}
            strokeDasharray="3 3"
            strokeOpacity={0.5}
            label={{ value: refLabel, position: "insideTopRight", fill: dangerColor, fontSize: 9 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            dot={false}
            stroke={isDanger ? dangerColor : color}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}