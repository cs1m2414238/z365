"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { CalendarDays, ChevronDown, Flame } from "lucide-react";
import {
  activityLevel,
  activitySummary,
  calendarWeeks,
  normalizeActivity,
} from "@/lib/activity";
import { Card } from "@/components/ui/card";
import { useDashboard } from "@/lib/dashboard-context";
import { PanelStatus } from "@/components/profile-connection";

export function ActivityHeatmap() {
  const [months, setMonths] = useState(12);
  const [selected, setSelected] = useState<{
    date: string;
    count: number;
  } | null>(null);
  const dashboard = useDashboard();
  const response = dashboard.activity.data;
  const data = useMemo(
    () =>
      response
        ? normalizeActivity(response.days, response.from, response.to)
        : [],
    [response],
  );
  const visible = useMemo(
    () => data.slice(-(months === 12 ? 365 : months === 6 ? 183 : 92)),
    [data, months],
  );
  const weeks = useMemo(() => calendarWeeks(visible), [visible]);
  const summary = activitySummary(data);
  const visibleSummary = activitySummary(visible);
  function navigateDay(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const movement: Record<string, number> = {
      ArrowLeft: -7,
      ArrowRight: 7,
      ArrowUp: -1,
      ArrowDown: 1,
    };
    if (!(event.key in movement)) return;
    event.preventDefault();
    const next =
      visible[
        visible.findIndex((day) => day.date === date) + movement[event.key]
      ];
    if (next) {
      setSelected(next);
      document.getElementById(`activity-${next.date}`)?.focus();
    }
  }
  let previousMonth = -1;
  const monthLabels = weeks
    .map((week, index) => {
      const first = week.find(Boolean);
      if (!first) return null;
      const date = new Date(`${first.date}T12:00:00Z`);
      if (
        date.getUTCMonth() === previousMonth ||
        (index > weeks.length - 3 && index !== 0)
      )
        return null;
      previousMonth = date.getUTCMonth();
      return {
        index,
        label: date.toLocaleDateString("en", {
          month: "short",
          timeZone: "UTC",
        }),
      };
    })
    .filter(Boolean);

  return (
    <Card className="heatmap-card">
      <div className="card-heading">
        <h2>
          <CalendarDays size={19} />
          Activity heatmap
        </h2>
        <label className="select-wrap">
          <span className="sr-only">Activity period</span>
          <select
            aria-label="Activity period"
            value={months}
            onChange={(event) => {
              setMonths(Number(event.target.value));
              setSelected(null);
            }}
          >
            <option value={12}>Last 12 months</option>
            <option value={6}>Last 6 months</option>
            <option value={3}>Last 3 months</option>
          </select>
          <ChevronDown size={13} />
        </label>
      </div>
      {!response || dashboard.activity.isError ? (
        <PanelStatus
          pending={dashboard.activity.isPending}
          error={dashboard.activity.error}
        />
      ) : (
        <>
          <div className="heatmap-subheading">
            <span>
              <strong>{visibleSummary.total.toLocaleString("en-US")}</strong>{" "}
              {dashboard.source === "demo"
                ? " contributions in the "
                : " recorded actions in the "}
              {months === 12 ? "last year" : `last ${months} months`}
            </span>
            <span className="streak-tag">
              <Flame size={13} />
              {summary.currentStreak}-day streak
            </span>
          </div>
          <div className="heatmap-scroll">
            <div
              className="heatmap-calendar"
              style={{ minWidth: months === 12 ? 560 : 440 }}
            >
              <div className="heatmap-day-labels">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>
              <div className="heatmap-data">
                <div
                  className="heatmap-months"
                  style={{
                    gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
                  }}
                >
                  {monthLabels.map(
                    (month) =>
                      month && (
                        <span
                          key={month.index}
                          style={{ gridColumn: month.index + 1 }}
                        >
                          {month.label}
                        </span>
                      ),
                  )}
                </div>
                <div
                  className="heatmap-grid"
                  aria-label="Daily activity, use arrow keys to navigate"
                  style={{
                    gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
                  }}
                >
                  {weeks.map((week, weekIndex) => (
                    <div className="heatmap-week" key={weekIndex}>
                      {week.map((day, dayIndex) =>
                        day ? (
                          <button
                            id={`activity-${day.date}`}
                            key={day.date}
                            tabIndex={
                              day.date ===
                              (selected?.date ||
                                visible[visible.length - 1]?.date)
                                ? 0
                                : -1
                            }
                            className={`heatmap-cell level-${activityLevel(day.count)} ${selected?.date === day.date ? "selected" : ""}`}
                            title={`${day.count} contributions on ${new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}`}
                            aria-label={`${day.date}: ${day.count} contributions`}
                            onKeyDown={(event) => navigateDay(event, day.date)}
                            onClick={() => setSelected(day)}
                          />
                        ) : (
                          <span
                            key={`blank-${dayIndex}`}
                            className="heatmap-cell heatmap-blank"
                          />
                        ),
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="heatmap-bottom">
            <span className="heatmap-detail" aria-live="polite">
              {selected ? (
                <>
                  <strong>{selected.count}</strong> contributions ·{" "}
                  {new Date(`${selected.date}T12:00:00Z`).toLocaleDateString(
                    "en",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    },
                  )}
                </>
              ) : (
                <>
                  <strong>{summary.activeDays}</strong> active days <i />
                  Best streak <strong>{summary.longestStreak} days</strong>
                </>
              )}
            </span>
            <div className="heatmap-legend">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <span key={level} className={`heatmap-cell level-${level}`} />
              ))}
              <span>More</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
