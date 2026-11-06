import type { ActivityDay } from "@z365/contracts";

/** Fixed sample period makes the demo reproducible; real activity comes from core-api. */
export const DEMO_END_DATE = "2026-11-02";

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function createDemoActivity(
  endDate = DEMO_END_DATE,
  days = 365,
): ActivityDay[] {
  const end = new Date(`${endDate}T12:00:00Z`);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - (days - 1 - index));
    const seed = ((index + 11) * 167 + index * index * 13) % 101;
    let count =
      seed < 22
        ? 0
        : seed < 55
          ? 1 + (seed % 3)
          : seed < 80
            ? 4 + (seed % 4)
            : 8 + (seed % 9);
    if (index >= 100 && index < 142) count = 2 + (seed % 12);
    if (index === 99 || index === 142) count = 0;
    if (index >= days - 18) count = 3 + (seed % 12);
    if (index === days - 19) count = 0;
    return { date: dateKey(date), count };
  });
}

export function activitySummary(days: ActivityDay[]) {
  let longestStreak = 0;
  let currentStreak = 0;
  for (const day of days) {
    currentStreak = day.count > 0 ? currentStreak + 1 : 0;
    longestStreak = Math.max(longestStreak, currentStreak);
  }
  return {
    total: days.reduce((sum, day) => sum + day.count, 0),
    activeDays: days.filter((day) => day.count > 0).length,
    currentStreak,
    longestStreak,
  };
}

export function activityLevel(count: number) {
  return count === 0
    ? 0
    : count <= 3
      ? 1
      : count <= 7
        ? 2
        : count <= 11
          ? 3
          : 4;
}

export function calendarWeeks(days: ActivityDay[]): (ActivityDay | null)[][] {
  if (!days.length) return [];
  const firstWeekday = new Date(`${days[0].date}T12:00:00Z`).getUTCDay();
  const padded: (ActivityDay | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...days,
  ];
  while (padded.length % 7 !== 0) padded.push(null);
  return Array.from({ length: padded.length / 7 }, (_, index) =>
    padded.slice(index * 7, index * 7 + 7),
  );
}

export const demoActivity = createDemoActivity();

/** Fill calendar gaps only inside a successfully validated API activity range. */
export function normalizeActivity(
  days: ActivityDay[],
  from: string,
  to: string,
): ActivityDay[] {
  const start = Date.parse(`${from}T12:00:00Z`);
  const length =
    Math.floor((Date.parse(`${to}T12:00:00Z`) - start) / 86_400_000) + 1;
  if (!Number.isFinite(length) || length < 1 || length > 366)
    throw new Error("Invalid activity range.");
  const values = new Map(days.map((day) => [day.date, day.count]));
  return Array.from({ length }, (_, index) => {
    const date = dateKey(new Date(start + index * 86_400_000));
    return { date, count: values.get(date) ?? 0 };
  });
}
