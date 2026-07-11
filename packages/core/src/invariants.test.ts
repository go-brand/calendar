import { test, fc } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { buildMonth } from "./utils/buildMonth";
import { buildWeek } from "./utils/buildWeek";
import { buildDay } from "./utils/buildDay";
import { getWeekDateRange, getMonthDateRange } from "./utils/dateRanges";
import type { CalendarAccessor } from "./types";

/**
 * Property-based invariants.
 *
 * Unlike the example-based tests, these assert behavioral *laws* that must hold
 * for every calendar — "a month is made of 7-day weeks", "days are contiguous",
 * "every event lands on exactly its own date". They are deliberately decoupled
 * from specific dates so they keep catching date-math regressions even as the
 * surrounding API evolves. fast-check feeds each law ~100 random inputs and
 * shrinks any failure to the smallest reproducing case.
 */

// --- Arbitraries ------------------------------------------------------------

// A fixed but representative window of years (covers leap years, century non-leap 2100).
const yearArb = fc.integer({ min: 1971, max: 2100 });
const monthArb = fc.integer({ min: 1, max: 12 });
const weekStartArb = fc.integer({ min: 1, max: 7 }).map((n) => n as 1 | 2 | 3 | 4 | 5 | 6 | 7);

// A valid PlainDate (day clamped to the month's real length, so no invalid dates).
const plainDateArb = fc
  .record({ year: yearArb, month: monthArb, day: fc.integer({ min: 1, max: 31 }) })
  .map(({ year, month, day }) => {
    const ym = Temporal.PlainYearMonth.from({ year, month });
    return Temporal.PlainDate.from({ year, month, day: Math.min(day, ym.daysInMonth) });
  });

// --- buildMonth -------------------------------------------------------------

describe("buildMonth invariants", () => {
  test.prop([yearArb, monthArb, weekStartArb])(
    "every week contains exactly 7 days",
    (year, month, weekStartsOn) => {
      const { weeks } = buildMonth(year, month, { weekStartsOn });
      for (const week of weeks) {
        expect(week).toHaveLength(7);
      }
    },
  );

  test.prop([yearArb, monthArb, weekStartArb])(
    "a month grid is always 4 to 6 weeks",
    (year, month, weekStartsOn) => {
      const { weeks } = buildMonth(year, month, { weekStartsOn });
      expect(weeks.length).toBeGreaterThanOrEqual(4);
      expect(weeks.length).toBeLessThanOrEqual(6);
    },
  );

  test.prop([yearArb, monthArb, weekStartArb])(
    "the grid begins on the configured weekStartsOn",
    (year, month, weekStartsOn) => {
      const { weeks } = buildMonth(year, month, { weekStartsOn });
      // Temporal dayOfWeek and weekStartsOn are both 1..7 (Mon..Sun).
      expect(weeks[0][0].date.dayOfWeek).toBe(weekStartsOn);
    },
  );

  test.prop([yearArb, monthArb, weekStartArb])(
    "days are strictly contiguous with no gaps or repeats",
    (year, month, weekStartsOn) => {
      const days = buildMonth(year, month, { weekStartsOn }).weeks.flat();
      for (let i = 1; i < days.length; i++) {
        const expected = days[i - 1].date.add({ days: 1 });
        expect(days[i].date.equals(expected)).toBe(true);
      }
    },
  );

  test.prop([yearArb, monthArb, weekStartArb])(
    "the count of current-month days equals daysInMonth",
    (year, month, weekStartsOn) => {
      const { weeks } = buildMonth(year, month, { weekStartsOn });
      const daysInMonth = Temporal.PlainYearMonth.from({ year, month }).daysInMonth;
      const currentMonthDays = weeks.flat().filter((d) => d.isCurrentMonth);
      expect(currentMonthDays).toHaveLength(daysInMonth);
    },
  );

  test.prop([yearArb, monthArb, weekStartArb])(
    "isCurrentMonth is true exactly for days in the target month",
    (year, month, weekStartsOn) => {
      const days = buildMonth(year, month, { weekStartsOn }).weeks.flat();
      for (const day of days) {
        const inTargetMonth = day.date.year === year && day.date.month === month;
        expect(day.isCurrentMonth).toBe(inTargetMonth);
      }
    },
  );

  test.prop([yearArb, monthArb, weekStartArb])(
    "the grid contains both the first and last day of the month",
    (year, month, weekStartsOn) => {
      const ym = Temporal.PlainYearMonth.from({ year, month });
      const first = ym.toPlainDate({ day: 1 });
      const last = ym.toPlainDate({ day: ym.daysInMonth });
      const days = buildMonth(year, month, { weekStartsOn }).weeks.flat();
      expect(days.some((d) => d.date.equals(first))).toBe(true);
      expect(days.some((d) => d.date.equals(last))).toBe(true);
    },
  );
});

// --- buildMonth data binding ------------------------------------------------

type Ev = { date: Temporal.PlainDate };
const accessor: CalendarAccessor<Ev> = { getDate: (e) => e.date };

describe("buildMonth data-binding invariants", () => {
  test.prop([yearArb, monthArb, weekStartArb, fc.array(plainDateArb, { maxLength: 40 })])(
    "each event appears on exactly its own date and nowhere else",
    (year, month, weekStartsOn, dates) => {
      const events: Ev[] = dates.map((date) => ({ date }));
      const days = buildMonth(year, month, { weekStartsOn, data: events, accessor }).weeks.flat();

      // Group events by date string for the expected count per visible day.
      const expectedByDate = new Map<string, number>();
      for (const e of events) {
        const key = e.date.toString();
        expectedByDate.set(key, (expectedByDate.get(key) ?? 0) + 1);
      }

      let totalPlaced = 0;
      for (const day of days) {
        const key = day.date.toString();
        // Every placed item on this day must actually have this day's date.
        for (const item of day.items) {
          expect(item.date.equals(day.date)).toBe(true);
        }
        expect(day.items.length).toBe(expectedByDate.get(key) ?? 0);
        totalPlaced += day.items.length;
      }

      // Total placed equals the number of events whose date is visible in the grid.
      const visibleDates = new Set(days.map((d) => d.date.toString()));
      const expectedVisible = events.filter((e) => visibleDates.has(e.date.toString())).length;
      expect(totalPlaced).toBe(expectedVisible);
    },
  );
});

// --- buildWeek --------------------------------------------------------------

describe("buildWeek invariants", () => {
  test.prop([plainDateArb, weekStartArb])(
    "a week always has 7 days starting on weekStartsOn",
    (date, weekStartsOn) => {
      const { days, weekStart, weekEnd } = buildWeek(date, { weekStartsOn });
      expect(days).toHaveLength(7);
      expect(weekStart.dayOfWeek).toBe(weekStartsOn);
      expect(weekEnd.equals(weekStart.add({ days: 6 }))).toBe(true);
    },
  );

  test.prop([plainDateArb, weekStartArb])(
    "days run contiguously from weekStart to weekEnd",
    (date, weekStartsOn) => {
      const { days, weekStart, weekEnd } = buildWeek(date, { weekStartsOn });
      expect(days[0].date.equals(weekStart)).toBe(true);
      expect(days[6].date.equals(weekEnd)).toBe(true);
      for (let i = 1; i < days.length; i++) {
        expect(days[i].date.equals(days[i - 1].date.add({ days: 1 }))).toBe(true);
      }
    },
  );

  test.prop([plainDateArb, weekStartArb])(
    "the reference date always falls within its own week",
    (date, weekStartsOn) => {
      const { weekStart, weekEnd } = buildWeek(date, { weekStartsOn });
      expect(Temporal.PlainDate.compare(date, weekStart)).toBeGreaterThanOrEqual(0);
      expect(Temporal.PlainDate.compare(date, weekEnd)).toBeLessThanOrEqual(0);
    },
  );
});

// --- buildDay time slots ----------------------------------------------------

const slotDurationArb = fc.constantFrom(15, 30, 60, 120);
const hourRangeArb = fc
  .tuple(fc.integer({ min: 0, max: 22 }), fc.integer({ min: 1, max: 24 }))
  .filter(([start, end]) => start < end);

describe("buildDay time-slot invariants", () => {
  test.prop([plainDateArb, hourRangeArb, slotDurationArb])(
    "the first slot starts exactly at startHour:00",
    (date, [startHour, endHour], slotDuration) => {
      const { timeSlots } = buildDay(date, { startHour, endHour, slotDuration });
      expect(timeSlots.length).toBeGreaterThan(0);
      expect(timeSlots[0].hour).toBe(startHour);
      expect(timeSlots[0].minute).toBe(0);
    },
  );

  test.prop([plainDateArb, hourRangeArb, slotDurationArb])(
    "slots are strictly increasing in time and stay within [startHour, endHour)",
    (date, [startHour, endHour], slotDuration) => {
      const { timeSlots } = buildDay(date, { startHour, endHour, slotDuration });
      for (const slot of timeSlots) {
        expect(slot.hour).toBeGreaterThanOrEqual(startHour);
        expect(slot.hour).toBeLessThan(endHour);
      }
      for (let i = 1; i < timeSlots.length; i++) {
        const prev = timeSlots[i - 1];
        const cur = timeSlots[i];
        const prevTotal = prev.hour * 60 + prev.minute;
        const curTotal = cur.hour * 60 + cur.minute;
        expect(curTotal).toBeGreaterThan(prevTotal);
      }
    },
  );
});

// --- dateRanges -------------------------------------------------------------

describe("dateRange invariants", () => {
  test.prop([plainDateArb, weekStartArb])(
    "week range spans exactly 7 days, start <= end, timezone preserved",
    (date, weekStartsOn) => {
      const tz = "UTC";
      const range = getWeekDateRange(date, tz, { weekStartsOn });
      expect(range.start.timeZoneId).toBe(tz);
      expect(range.end.timeZoneId).toBe(tz);
      expect(Temporal.ZonedDateTime.compare(range.start, range.end)).toBeLessThan(0);
      // Half-open start..end covers exactly 7 calendar days.
      const dayGap = range.start
        .toPlainDate()
        .until(range.end.toPlainDate(), { largestUnit: "days" }).days;
      expect(dayGap).toBe(7);
      // Both half-open boundaries are starts of calendar days.
      expect(range.start.toPlainTime().toString()).toBe("00:00:00");
      expect(range.end.toPlainTime().toString()).toBe("00:00:00");
    },
  );

  test.prop([plainDateArb, weekStartArb])(
    "month range begins on weekStartsOn and covers the whole month",
    (date, weekStartsOn) => {
      const tz = "UTC";
      const range = getMonthDateRange(date, tz, { weekStartsOn });
      expect(Temporal.ZonedDateTime.compare(range.start, range.end)).toBeLessThan(0);
      // Calendar bounds start on the configured first day of week.
      expect(range.start.toPlainDate().dayOfWeek).toBe(weekStartsOn);
      // The first and last of the reference month sit inside the range.
      const first = date.with({ day: 1 });
      const last = date.with({ day: date.daysInMonth });
      expect(Temporal.PlainDate.compare(range.start.toPlainDate(), first)).toBeLessThanOrEqual(0);
      expect(Temporal.PlainDate.compare(range.end.toPlainDate(), last)).toBeGreaterThan(0);
    },
  );

  test.prop([plainDateArb, weekStartArb])(
    "buildWeek and getWeekDateRange agree on the week start",
    (date, weekStartsOn) => {
      const { weekStart } = buildWeek(date, { weekStartsOn });
      const range = getWeekDateRange(date, "UTC", { weekStartsOn });
      expect(range.start.toPlainDate().equals(weekStart)).toBe(true);
    },
  );
});
