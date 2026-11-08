import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it, vi } from 'vitest';
import { createCalendar, buildDayView, buildMonthView, buildWeekView } from '../index';

describe('calendar v1 projections', () => {
  it('uses default timed geometry from true shorthand', () => {
    const shorthandCalendar = createCalendar({
      views: { week: true },
      date: Temporal.PlainDate.from('2026-07-10'),
    });

    const week = buildWeekView({ calendar: shorthandCalendar });

    expect(week.days).toHaveLength(7);
    expect(week.days[0].timeSlots).toHaveLength(24);
  });

  const calendar = createCalendar({
    views: {
      month: true,
      week: {
        dayStart: Temporal.PlainTime.from('08:00'),
        dayEnd: Temporal.PlainTime.from('10:00'),
        slotDuration: Temporal.Duration.from({ minutes: 30 }),
      },
      day: {
        dayStart: Temporal.PlainTime.from('08:00'),
        dayEnd: Temporal.PlainTime.from('10:00'),
        slotDuration: Temporal.Duration.from({ minutes: 30 }),
      },
    },
    date: Temporal.PlainDate.from('2026-07-10'),
    timeZone: 'America/Asuncion',
    weekStartsOn: 1,
  });

  it('projects unrelated item types under one controller', () => {
    const month = buildMonthView({
      calendar,
      items: [{ id: 'summary', date: Temporal.PlainDate.from('2026-07-10') }],
      getDate: (item) => item.date,
    });
    const startsAt = Temporal.ZonedDateTime.from('2026-07-10T08:30:00-03:00[America/Asuncion]');
    const week = buildWeekView({
      calendar,
      items: [{ id: 42, startsAt }],
      getDate: (item) => item.startsAt.toPlainDate(),
      getStart: (item) => item.startsAt,
    });

    expect(month).toMatchObject({ name: 'month', view: 'month' });
    expect(month.weeks.flatMap((days) => days.flatMap((day) => day.items))).toEqual([
      { id: 'summary', date: Temporal.PlainDate.from('2026-07-10') },
    ]);
    expect(week).toMatchObject({ name: 'week', view: 'week' });
    expect(week.days.flatMap((day) => day.timeSlots).flatMap((slot) => slot.items)).toEqual([
      { id: 42, startsAt },
    ]);
  });

  it('keeps untimed items at day level and out of time slots', () => {
    const day = buildDayView({
      calendar,
      items: [{ date: Temporal.PlainDate.from('2026-07-10') }],
      getDate: (item) => item.date,
    });

    expect(day).toMatchObject({ name: 'day', view: 'day' });
    expect(day.items).toHaveLength(1);
    expect(day.timeSlots).toHaveLength(4);
    expect(day.timeSlots.flatMap((slot) => slot.items)).toEqual([]);
  });

  it('builds data-free views without an item accessor', () => {
    expect(buildMonthView({ calendar }).weeks).toHaveLength(5);
    expect(buildWeekView({ calendar }).days).toHaveLength(7);
    expect(buildDayView({ calendar }).items).toEqual([]);
  });

  it('accepts only an immediate descendant of a registered controller', () => {
    const wrapper: typeof calendar = Object.create(calendar);
    expect(buildDayView({ calendar: wrapper }).date.toString()).toBe('2026-07-10');
    const nested: typeof calendar = Object.create(wrapper);
    expect(() => buildDayView({ calendar: nested })).toThrow('Unknown calendar controller');
    const unrelated: typeof calendar = Object.create(null);
    expect(() => buildDayView({ calendar: unrelated })).toThrow();
  });

  it('uses the configured timezone for isToday', () => {
    const timeZone = 'Pacific/Kiritimati';
    const now = Temporal.ZonedDateTime.from('2026-07-10T00:30:00+14:00[Pacific/Kiritimati]');
    const clock = vi.spyOn(Temporal.Now, 'zonedDateTimeISO').mockReturnValue(now);
    const today = now.toPlainDate();
    const zonedCalendar = createCalendar({
      views: { day: true },
      date: today,
      timeZone,
    });

    try {
      expect(buildDayView({ calendar: zonedCalendar }).isToday).toBe(true);
      expect(clock).toHaveBeenCalledWith(timeZone);
    } finally {
      clock.mockRestore();
    }
  });

  it('rejects items without getDate for JavaScript consumers', () => {
    expect(() => buildMonthView({ calendar, items: [{}] } as never)).toThrow(
      'getDate is required when items are supplied',
    );
  });

  it('rejects projections for views that are not configured', () => {
    const monthOnly = createCalendar({ views: { month: true } });
    expect(() => buildWeekView({ calendar: monthOnly } as never)).toThrow(
      'Calendar view "week" is not configured',
    );
  });
});
