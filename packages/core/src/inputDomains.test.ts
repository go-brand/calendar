import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';
import { buildDayView, buildMonthView, buildWeekView, createCalendar, getWeekdays } from './index';

const july10 = Temporal.PlainDate.from('2026-07-10');
const standup = Temporal.ZonedDateTime.from('2026-07-10T09:00[Europe/Madrid]');
const views = { month: true, week: true, day: true } as const;
const timeZone = 'Europe/Madrid';

// Values people reach for instead of a PlainDate.
const notDates = [
  ['Temporal.ZonedDateTime', standup],
  ['Temporal.PlainDateTime', standup.toPlainDateTime()],
  ['Temporal.Instant', standup.toInstant()],
  ['String', '2026-07-10'],
  ['Date', new Date('2026-07-10T09:00:00Z')],
] as const;

describe('calendar date inputs', () => {
  it('rejects a ZonedDateTime date instead of storing it', () => {
    // @ts-expect-error The calendar date is a PlainDate.
    expect(() => createCalendar({ views, timeZone, date: standup })).toThrow(
      'date must be a Temporal.PlainDate, got Temporal.ZonedDateTime',
    );
  });

  it('rejects every non-PlainDate date with a TypeError', () => {
    for (const [type, value] of notDates) {
      expect(() => createCalendar({ views, timeZone, date: value as never })).toThrow(TypeError);
      expect(() => createCalendar({ views, timeZone, date: value as never })).toThrow(
        `got ${type}`,
      );
    }
  });

  it('rejects a string in setDate and keeps the current date', () => {
    const calendar = createCalendar({ views, timeZone, date: july10 });
    // @ts-expect-error setDate takes a PlainDate.
    expect(() => calendar.setDate('2026-08-01')).toThrow(
      'setDate argument must be a Temporal.PlainDate, got String',
    );
    expect(calendar.date.toString()).toBe('2026-07-10');
  });
});

describe('item accessors', () => {
  const calendar = createCalendar({ views, timeZone, date: july10 });
  const events = [{ title: 'Standup', start: standup }];

  it('rejects getDate returning the event start instead of dropping the event', () => {
    expect(() =>
      // @ts-expect-error getDate must return a PlainDate; use start.toPlainDate().
      buildMonthView({
        calendar,
        items: events,
        getDate: (event) => event.start,
      }),
    ).toThrow('getDate result must be a Temporal.PlainDate, got Temporal.ZonedDateTime');
  });

  it('rejects every non-PlainDate getDate result', () => {
    for (const [type, value] of notDates) {
      const build = () =>
        buildWeekView({ calendar, items: [value], getDate: (item) => item as never });
      expect(build).toThrow(TypeError);
      expect(build).toThrow(`got ${type}`);
    }
  });

  it('rejects a getStart result that is not a ZonedDateTime', () => {
    for (const [type, value] of [
      ['Temporal.PlainTime', standup.toPlainTime()],
      ['Temporal.Instant', standup.toInstant()],
      ['String', '09:00'],
    ] as const) {
      const build = () =>
        buildDayView({
          calendar,
          items: events,
          getDate: (event) => event.start.toPlainDate(),
          getStart: () => value as never,
        });
      expect(build).toThrow(`getStart result must be a Temporal.ZonedDateTime, got ${type}`);
    }
  });

  it('places the event when both accessors return the right types', () => {
    const day = buildDayView({
      calendar,
      items: events,
      getDate: (event) => event.start.toPlainDate(),
      getStart: (event) => event.start,
    });
    expect(day.items).toEqual(events);
    expect(day.timeSlots.find((slot) => slot.hour === 9)?.items).toEqual(events);
  });
});

describe('timed view config', () => {
  it('rejects string times and durations', () => {
    // @ts-expect-error dayStart is a PlainTime.
    expect(() => createCalendar({ views: { week: { dayStart: '08:00' } } })).toThrow(
      'week dayStart must be a Temporal.PlainTime, got String',
    );
    // @ts-expect-error dayEnd is a PlainTime.
    expect(() => createCalendar({ views: { day: { dayEnd: '18:00' } } })).toThrow(
      'day dayEnd must be a Temporal.PlainTime, got String',
    );
    // @ts-expect-error slotDuration is a Duration.
    expect(() => createCalendar({ views: { week: { slotDuration: 'PT30M' } } })).toThrow(
      'week slotDuration must be a Temporal.Duration, got String',
    );
  });
});

describe('weekStartsOn', () => {
  it('rejects 0 for Sunday, which is the Date convention, not Temporal', () => {
    // @ts-expect-error Temporal weekdays run 1 (Monday) through 7 (Sunday).
    expect(() => createCalendar({ views, timeZone, weekStartsOn: 0 })).toThrow(
      'weekStartsOn must be 1 (Monday) through 7 (Sunday), got 0',
    );
    // @ts-expect-error Temporal weekdays run 1 (Monday) through 7 (Sunday).
    expect(() => getWeekdays(0)).toThrow(RangeError);
  });

  it('rejects values past Sunday', () => {
    // @ts-expect-error Temporal weekdays run 1 (Monday) through 7 (Sunday).
    expect(() => getWeekdays(8)).toThrow('got 8');
  });
});

describe.runIf('Temporal' in globalThis)('native Temporal values', () => {
  it('accepts a native PlainDate, since the check reads the Temporal type tag', () => {
    const native = (globalThis as unknown as { Temporal: typeof Temporal }).Temporal;
    const calendar = createCalendar({ views, timeZone, date: native.PlainDate.from('2026-07-10') });
    calendar.setDate(native.PlainDate.from('2026-07-11'));
    expect(calendar.date.toString()).toBe('2026-07-11');
  });
});
