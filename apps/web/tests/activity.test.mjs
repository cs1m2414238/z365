import assert from "node:assert/strict";
import test from "node:test";
import {
  activityLevel,
  activitySummary,
  calendarWeeks,
  createDemoActivity,
  normalizeActivity,
} from "../src/lib/activity.ts";

test("the yearly calendar has exactly 365 unique, chronological dates", () => {
  const days = createDemoActivity();
  assert.equal(days.length, 365);
  assert.equal(new Set(days.map((day) => day.date)).size, 365);
  assert.equal(days[0].date, "2025-11-03");
  assert.equal(days.at(-1).date, "2026-11-02");
  for (let index = 1; index < days.length; index++) {
    assert.equal(
      Date.parse(days[index].date) - Date.parse(days[index - 1].date),
      86_400_000,
    );
  }
});

test("API calendar gaps stay empty while supplied dates retain their actual counts", () => {
  assert.deepEqual(normalizeActivity([{ date: "2026-11-02", count: 8 }], "2026-11-01", "2026-11-03"), [{ date: "2026-11-01", count: 0 }, { date: "2026-11-02", count: 8 }, { date: "2026-11-03", count: 0 }]);
  assert.throws(() => normalizeActivity([], "2026-11-03", "2026-11-01"));
  assert.throws(() => normalizeActivity([], "2024-01-01", "2026-11-03"));
});

test("calendar generation preserves February 29 and crosses year boundaries", () => {
  assert.deepEqual(
    createDemoActivity("2024-03-01", 3).map((day) => day.date),
    ["2024-02-28", "2024-02-29", "2024-03-01"],
  );
  assert.deepEqual(
    createDemoActivity("2026-01-01", 2).map((day) => day.date),
    ["2025-12-31", "2026-01-01"],
  );
});

test("week padding preserves all days and aligns Sunday through Saturday", () => {
  const days = createDemoActivity("2026-11-02", 365);
  const weeks = calendarWeeks(days);
  assert.ok(weeks.every((week) => week.length === 7));
  assert.deepEqual(weeks.flat().filter(Boolean), days);
  for (const week of weeks)
    week.forEach((day, weekday) => {
      if (day)
        assert.equal(new Date(`${day.date}T12:00:00Z`).getUTCDay(), weekday);
    });
  assert.deepEqual(calendarWeeks([]), []);
});

test("streaks reset on inactive days and distinguish current from longest", () => {
  const counts = [0, 2, 3, 1, 0, 4, 5];
  const days = counts.map((count, index) => ({
    date: `2026-10-${String(index + 1).padStart(2, "0")}`,
    count,
  }));
  assert.deepEqual(activitySummary(days), {
    total: 15,
    activeDays: 5,
    currentStreak: 2,
    longestStreak: 3,
  });
  assert.equal(
    activitySummary([...days, { date: "2026-10-08", count: 0 }]).currentStreak,
    0,
  );
  assert.deepEqual(activitySummary([]), {
    total: 0,
    activeDays: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
});

test("the sample streak is reproducible and the legend has five distinct levels", () => {
  const summary = activitySummary(createDemoActivity());
  assert.equal(summary.currentStreak, 18);
  assert.equal(summary.longestStreak, 42);
  assert.deepEqual(
    [0, 1, 3, 4, 7, 8, 11, 12, 100].map(activityLevel),
    [0, 1, 1, 2, 2, 3, 3, 4, 4],
  );
});
