"use client";

import { useId, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { useDashboard } from "@/lib/dashboard-context";
import { PanelStatus } from "@/components/profile-connection";

export function RatingChart() {
  const dashboard = useDashboard();
  const [period, setPeriod] = useState(30);
  const id = useId().replace(/:/g, "");
  const history = [...(dashboard.ratings.data?.history || [])].sort(
    (left, right) => left.date.localeCompare(right.date),
  );
  const end =
    dashboard.source === "demo"
      ? Date.parse("2026-11-02T12:00:00Z")
      : Date.now();
  const data = history
    .filter(
      (point) =>
        Date.parse(`${point.date}T12:00:00Z`) >= end - period * 86_400_000,
    )
    .map((point) => {
      const date = new Date(`${point.date}T12:00:00Z`);
      return {
        rating: point.rating,
        date: date.toLocaleDateString("en", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
      };
    });
  const delta =
    data.length > 1 ? data[data.length - 1].rating - data[0].rating : null;
  return (
    <Card className="rating-card">
      <div className="card-heading">
        <h2>Engineering rating</h2>
        <label className="select-wrap select-quiet">
          <span className="sr-only">Rating period</span>
          <select
            aria-label="Rating period"
            value={period}
            onChange={(event) => setPeriod(Number(event.target.value))}
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <ChevronDown size={12} />
        </label>
      </div>
      <div className="rating-value">
        <strong>
          {dashboard.ratings.data?.score?.toLocaleString("en-US") ?? "—"}
        </strong>
        {delta !== null && (
          <span className={`growth-pill ${delta < 0 ? "rating-decrease" : ""}`}>
            <ArrowUpRight size={14} />
            {delta >= 0 ? "+" : ""}
            {delta}
            <span className="rating-period">({period}d)</span>
          </span>
        )}
        {dashboard.ratings.data?.level && (
          <span className="rating-level">{dashboard.ratings.data.level}</span>
        )}
      </div>
      {dashboard.ratings.isPending ||
      dashboard.ratings.isError ||
      !data.length ? (
        <PanelStatus
          pending={dashboard.ratings.isPending}
          error={dashboard.ratings.error}
          empty={!data.length}
        >
          No Z365 rating history is available.
        </PanelStatus>
      ) : (
        <div
          className="rating-chart"
          role="img"
          aria-label={`${dashboard.source === "demo" ? "Demo " : ""}Engineering rating from ${data[0].rating} to ${data[data.length - 1].rating} over ${period} days`}
        >
          <ResponsiveContainer width="100%" height="100%" minHeight={75}>
            <AreaChart
              data={data}
              margin={{ top: 9, bottom: 0, left: 2, right: 7 }}
            >
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--chart-line, #8a6cf7)"
                    stopOpacity="var(--chart-fill-opacity, 0.14)"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-line)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["dataMin - 45", "dataMax + 15"]} />
              <Tooltip
                contentStyle={{
                  background: "var(--chart-tooltip, #fffffff5)",
                  border: "1px solid var(--chart-tooltip-border, #e7e1fa)",
                  color: "var(--ink)",
                  borderRadius: 12,
                  fontSize: 12,
                  boxShadow: "var(--surface-shadow)",
                }}
                itemStyle={{ color: "var(--chart-line)" }}
                labelStyle={{ color: "var(--text)" }}
                formatter={(value) => [value, "Rating"]}
                cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
              />
              <Area
                type="monotone"
                dataKey="rating"
                stroke="var(--chart-line, #8b68ee)"
                strokeWidth={2.5}
                fill={`url(#${id})`}
                activeDot={{
                  r: 5,
                  fill: "var(--chart-line)",
                  stroke: "var(--text)",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
