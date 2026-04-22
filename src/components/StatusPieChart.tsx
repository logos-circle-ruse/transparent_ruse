import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { SIGNAL_STATUSES, type Signal } from "../types";
import type { Locale } from "../i18n";

const STATUS_COLORS: Record<(typeof SIGNAL_STATUSES)[number], string> = {
  Resolved: "#1f8f4f",
  Pending: "#d49a00",
  "No Response": "#a01f44",
};

interface StatusPieChartProps {
  signals: Signal[];
  title: string;
  description: string;
  locale: Locale;
  statusLabel: (status: (typeof SIGNAL_STATUSES)[number]) => string;
}

export function StatusPieChart({
  signals,
  title,
  description,
  locale,
  statusLabel,
}: StatusPieChartProps) {
  const data = SIGNAL_STATUSES.map((status) => ({
    name: status,
    label: statusLabel(status),
    value: signals.filter((signal) => signal.status === status).length,
  }));

  return (
    <section className="card">
      <header className="section-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={70}
              outerRadius={105}
              paddingAngle={3}
              isAnimationActive
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [value, locale === "bg" ? "Брой" : "Count"]}
              labelFormatter={(label) => label}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="legend">
        {data.map((entry) => (
          <li key={entry.name}>
            <span
              className="legend-dot"
              style={{ backgroundColor: STATUS_COLORS[entry.name] }}
            />
            <span>{entry.label}</span>
            <strong>{entry.value}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
