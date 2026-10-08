import { test, fc } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { createCalendar, buildMonthView, buildWeekView, buildDayView } from './index';
import { getWeekDateRange, getMonthDateRange } from './utils/dateRanges';

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

describe('public month invariants', () => {
  test.prop([yearArb, monthArb, weekStartArb])(
    'every week contains exactly 7 days',
    (year, month, weekStartsOn) => {
      const { weeks } = buildMonthView({
        calendar: createCalendar({
          views: { month: true },
          date: Temporal.PlainDate.from({ year, month, day: 1 }),
          weekStartsOn,
        }),
      });
      for (const week of weeks) {
        expect(week).toHaveLength(7);
      }
    },
  );

  test.prop([yearArb, monthArb, weekStartArb])(
    'a month grid is always 4 to 6 weeks',
    (year, month, weekStartsOn) => {
      const { weeks } = buildMonthView({
        calendar: createCalendar({
          views: { month: true },
          date: Temporal.PlainDate.from({ year, month, day: 1 }),
          weekStartsOn,
        }),
      });
      expect(weeks.length).toBeGreaterThanOrEqual(4);
      expect(weeks.length).toBeLessThanOrEqual(6);
    },
  );

  test.prop([yearArb, monthArb, weekStartArb])(
    'the grid begins on the configured weekStartsOn',
    (year, month, weekStartsOn) => {
      const { weeks } = buildMonthView({
        calendar: createCalendar({
          views: { month: true },
          date: Temporal.PlainDate.from({ year, month, day: 1 }),
          weekStartsOn,
        }),
      });
      // Temporal dayOfWeek and weekStartsOn are both 1..7 (Mon..Sun).
      expect(weeks[0][0].date.dayOfWeek).toBe(weekStartsOn);
    },
  );

  test.prop([yearArb, monthArb, weekStartArb])(
    'days are strictly contiguous with no gaps or repeats',
    (year, month, weekStartsOn) => {
      const days = buildMonthView({
        calendar: createCalendar({
          views: { month: true },
          date: Temporal.PlainDate.from({ year, month, day: 1 }),
          weekStartsOn,
        }),
      }).weeks.flat();
      for (let i = 1; i < days.length; i++) {
        const expected = days[i - 1].date.add({ days: 1 });
        expect(days[i].date.equals(expected)).toBe(true);
      }
    },
  );

  test.prop([yearArb, monthArb, weekStartArb])(
    'the count of current-month days equals daysInMonth',
    (year, month, weekStartsOn) => {
      const { weeks } = buildMonthView({
        calendar: createCalendar({
          views: { month: true },
          date: Temporal.PlainDate.from({ year, month, day: 1 }),
          weekStartsOn,
        }),
      });
      const daysInMonth = Temporal.PlainYearMonth.from({ year, month }).daysInMonth;
      const currentMonthDays = weeks.flat().filter((d) => d.isCurrentMonth);
      expect(currentMonthDays).toHaveLength(daysInMonth);
    },
  );

  test.prop([yearArb, monthArb, weekStartArb])(
    'isCurrentMonth is true exactly for days in the target month',
    (year, month, weekStartsOn) => {
      const days = buildMonthView({
        calendar: createCalendar({
          views: { month: true },
          date: Temporal.PlainDate.from({ year, month, day: 1 }),
          weekStartsOn,
        }),
      }).weeks.flat();
      for (const day of days) {
        const inTargetMonth = day.date.year === year && day.date.month === month;
        expect(day.isCurrentMonth).toBe(inTargetMonth);
      }
    },
  );

  test.prop([yearArb, monthArb, weekStartArb])(
    'the grid contains both the first and last day of the month',
    (year, month, weekStartsOn) => {
      const ym = Temporal.PlainYearMonth.from({ year, month });
      const first = ym.toPlainDate({ day: 1 });
      const last = ym.toPlainDate({ day: ym.daysInMonth });
      const days = buildMonthView({
        calendar: createCalendar({
          views: { month: true },
          date: Temporal.PlainDate.from({ year, month, day: 1 }),
          weekStartsOn,
        }),
      }).weeks.flat();
      expect(days.some((d) => d.date.equals(first))).toBe(true);
      expect(days.some((d) => d.date.equals(last))).toBe(true);
    },
  );
});

// --- buildMonth data binding ------------------------------------------------

type Ev = { date: Temporal.PlainDate };

describe('public month data-binding invariants', () => {
  test.prop([yearArb, monthArb, weekStartArb, fc.array(plainDateArb, { maxLength: 40 })])(
    'each event appears on exactly its own date and nowhere else',
    (year, month, weekStartsOn, dates) => {
      const events: Ev[] = dates.map((date) => ({ date }));
      const days = buildMonthView({
        calendar: createCalendar({
          views: { month: true },
          date: Temporal.PlainDate.from({ year, month, day: 1 }),
          weekStartsOn,
        }),
        items: events,
        getDate: (event) => event.date,
      }).weeks.flat();

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

describe('public week invariants', () => {
  test.prop([plainDateArb, weekStartArb])(
    'a week always has 7 days starting on weekStartsOn',
    (date, weekStartsOn) => {
      const { days, weekStart, weekEnd } = buildWeekView({
        calendar: createCalendar({ views: { week: true }, date, weekStartsOn }),
      });
      expect(days).toHaveLength(7);
      expect(weekStart.dayOfWeek).toBe(weekStartsOn);
      expect(weekEnd.equals(weekStart.add({ days: 6 }))).toBe(true);
    },
  );

  test.prop([plainDateArb, weekStartArb])(
    'days run contiguously from weekStart to weekEnd',
    (date, weekStartsOn) => {
      const { days, weekStart, weekEnd } = buildWeekView({
        calendar: createCalendar({ views: { week: true }, date, weekStartsOn }),
      });
      expect(days[0].date.equals(weekStart)).toBe(true);
      expect(days[6].date.equals(weekEnd)).toBe(true);
      for (let i = 1; i < days.length; i++) {
        expect(days[i].date.equals(days[i - 1].date.add({ days: 1 }))).toBe(true);
      }
    },
  );

  test.prop([plainDateArb, weekStartArb])(
    'the reference date always falls within its own week',
    (date, weekStartsOn) => {
      const { weekStart, weekEnd } = buildWeekView({
        calendar: createCalendar({ views: { week: true }, date, weekStartsOn }),
      });
      expect(Temporal.PlainDate.compare(date, weekStart)).toBeGreaterThanOrEqual(0);
      expect(Temporal.PlainDate.compare(date, weekEnd)).toBeLessThanOrEqual(0);
    },
  );
});

// --- dateRanges -------------------------------------------------------------

describe('dateRange invariants', () => {
  test.prop([plainDateArb, weekStartArb])(
    'week range spans exactly 7 days, start <= end, timezone preserved',
    (date, weekStartsOn) => {
      const tz = 'UTC';
      const range = getWeekDateRange(date, tz, { weekStartsOn });
      expect(range.start.timeZoneId).toBe(tz);
      expect(range.end.timeZoneId).toBe(tz);
      expect(Temporal.ZonedDateTime.compare(range.start, range.end)).toBeLessThan(0);
      // Half-open start..end covers exactly 7 calendar days.
      const dayGap = range.start
        .toPlainDate()
        .until(range.end.toPlainDate(), { largestUnit: 'days' }).days;
      expect(dayGap).toBe(7);
      // Both half-open boundaries are starts of calendar days.
      expect(range.start.toPlainTime().toString()).toBe('00:00:00');
      expect(range.end.toPlainTime().toString()).toBe('00:00:00');
    },
  );

  test.prop([plainDateArb, weekStartArb])(
    'month range begins on weekStartsOn and covers the whole month',
    (date, weekStartsOn) => {
      const tz = 'UTC';
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
    'public week and getWeekDateRange agree on the week start',
    (date, weekStartsOn) => {
      const { weekStart } = buildWeekView({
        calendar: createCalendar({ views: { week: true }, date, weekStartsOn }),
      });
      const range = getWeekDateRange(date, 'UTC', { weekStartsOn });
      expect(range.start.toPlainDate().equals(weekStart)).toBe(true);
    },
  );
});

// Minute-aligned, positive intraday geometry; no calendar units or >24-hour durations.
const minuteRangeArb = fc.tuple(fc.integer({ min: 0, max: 1380 }), fc.integer({ min: 1, max: 59 }));
const timeAt = (minute: number) =>
  Temporal.PlainTime.from({ hour: Math.floor(minute / 60), minute: minute % 60 });

describe('public projection contracts', () => {
  test.prop([
    plainDateArb,
    weekStartArb,
    fc.array(fc.integer({ min: -40, max: 40 }), { maxLength: 30 }),
  ])(
    'retains frozen arbitrary records exactly once on supplied visible dates across independent projections',
    (date, weekStartsOn, offsets) => {
      const calendar = createCalendar({
        views: { month: true, week: true, day: true },
        date,
        weekStartsOn,
      });
      // Guarantee repeated same-day and outside-grid records in every run.
      const dates = [
        date,
        date,
        date.add({ days: 100 }),
        ...offsets.map((days) => date.add({ days })),
      ];
      const summaries = Object.freeze(
        dates.map((on, index) =>
          Object.freeze({ label: `summary-${index}`, on, payload: Object.freeze({ index }) }),
        ),
      );
      const bookings = Object.freeze(
        dates.map((when, index) => Object.freeze({ number: index, when, enabled: true })),
      );
      const month = buildMonthView({ calendar, items: summaries, getDate: (item) => item.on });
      const week = buildWeekView({ calendar, items: bookings, getDate: (item) => item.when });
      for (const day of month.weeks.flat()) {
        const expected = summaries.filter((item) => item.on.equals(day.date));
        expect(day.items).toEqual(expected);
        day.items.forEach((item, index) => expect(item).toBe(expected[index]));
      }
      for (const day of week.days) {
        const expected = bookings.filter((item) => item.when.equals(day.date));
        expect(day.items).toEqual(expected);
        day.items.forEach((item, index) => expect(item).toBe(expected[index]));
        expect(day.timeSlots.flatMap((slot) => slot.items)).toEqual([]);
      }
      expect(summaries.map((item) => item.on)).toEqual(dates);
      expect(bookings.map((item) => item.when)).toEqual(dates);
      expect(
        buildMonthView({ calendar })
          .weeks.flat()
          .every((day) => day.items.length === 0),
      ).toBe(true);
      expect(buildWeekView({ calendar }).days.every((day) => day.items.length === 0)).toBe(true);
      expect(buildDayView({ calendar }).items).toEqual([]);
    },
  );

  test.prop([plainDateArb, minuteRangeArb, fc.constantFrom(15, 30, 60, 120)])(
    'minute-aligned slots cover explicit intraday bounds and assign boundaries only to the next slot',
    (date, [start, length], duration) => {
      const end = start + length;
      const config = {
        dayStart: timeAt(start),
        dayEnd: timeAt(end),
        slotDuration: Temporal.Duration.from({ minutes: duration }),
      };
      const calendar = createCalendar({
        views: { day: config, week: config },
        date,
        timeZone: 'UTC',
      });
      const minutes = Array.from(
        { length: Math.ceil(length / duration) },
        (_, index) => start + index * duration,
      );
      const items = Object.freeze(
        [...minutes, end].map((minute) =>
          Object.freeze({
            start: date.toZonedDateTime({ timeZone: 'UTC', plainTime: timeAt(minute) }),
          }),
        ),
      );
      const options = {
        calendar,
        items,
        getDate: (item: (typeof items)[number]) => item.start.toPlainDate(),
        getStart: (item: (typeof items)[number]) => item.start,
      };
      const day = buildDayView(options);
      const weekDay = buildWeekView(options).days.find((candidate) => candidate.date.equals(date))!;
      for (const projection of [day, weekDay]) {
        expect(projection.items).toEqual(items);
        expect(projection.timeSlots.map((slot) => slot.time)).toEqual(minutes.map(timeAt));
        projection.timeSlots.forEach((slot, index) => expect(slot.items).toEqual([items[index]]));
        const placed = projection.timeSlots.flatMap((slot) => slot.items);
        expect(placed).toHaveLength(minutes.length);
        expect(placed.includes(items[items.length - 1])).toBe(false);
        placed.forEach((item, index) => expect(item).toBe(items[index]));
      }
      expect(
        buildDayView({ calendar, items, getDate: options.getDate }).timeSlots.flatMap(
          (slot) => slot.items,
        ),
      ).toEqual([]);
    },
  );

  test.prop([plainDateArb, weekStartArb])(
    'controller half-open visible ranges match the rendered dates in all three views',
    (date, weekStartsOn) => {
      const calendar = createCalendar({
        views: { month: true, week: true, day: true },
        date,
        weekStartsOn,
        timeZone: 'America/New_York',
      });
      for (const view of ['month', 'week', 'day'] as const) {
        calendar.setView(view);
        const dates =
          view === 'month'
            ? buildMonthView({ calendar })
                .weeks.flat()
                .map((day) => day.date)
            : view === 'week'
              ? buildWeekView({ calendar }).days.map((day) => day.date)
              : [buildDayView({ calendar }).date];
        expect(calendar.visibleRange.start.toPlainDate().equals(dates[0])).toBe(true);
        expect(
          calendar.visibleRange.end.toPlainDate().equals(dates[dates.length - 1].add({ days: 1 })),
        ).toBe(true);
      }
    },
  );

  test.each([
    ['2000-02-01', 29],
    ['2024-02-01', 29],
    ['2100-02-01', 28],
  ] as const)('covers every February date exactly once for %s', (input, count) => {
    const date = Temporal.PlainDate.from(input);
    for (const weekStartsOn of [1, 2, 3, 4, 5, 6, 7] as const) {
      const days = buildMonthView({
        calendar: createCalendar({ views: { month: true }, date, weekStartsOn }),
      })
        .weeks.flat()
        .filter((day) => day.isCurrentMonth);
      expect(days.map((day) => day.date.day)).toEqual(
        Array.from({ length: count }, (_, index) => index + 1),
      );
    }
  });

  test.each([
    ['2026-03-08', 23],
    ['2026-11-01', 25],
  ] as const)('renders %s as one calendar day spanning %i elapsed hours', (input, hours) => {
    const date = Temporal.PlainDate.from(input);
    const calendar = createCalendar({ views: { day: true }, date, timeZone: 'America/New_York' });
    const day = buildDayView({ calendar });
    const { start, end } = calendar.visibleRange;
    expect(start.toPlainDate().equals(day.date)).toBe(true);
    expect(end.toPlainDate().equals(day.date.add({ days: 1 }))).toBe(true);
    expect(start.until(end, { largestUnit: 'hours' }).hours).toBe(hours);
  });
});
