import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it, vi } from 'vitest';
import { createCalendar } from './calendar';

describe('calendar v1 controller', () => {
  it('normalizes true view shorthand to canonical object configs', () => {
    const calendar = createCalendar({
      views: { week: true, month: true },
      defaultView: 'month',
    });

    expect(calendar.views).toEqual({ week: {}, month: {} });
    expect(calendar.viewNames).toEqual(['week', 'month']);
    calendar.setView('week');
    expect(calendar.view).toBe('week');
  });

  it('derives a half-open month range in the configured timezone', () => {
    const calendar = createCalendar({
      views: { month: true, week: true },
      date: Temporal.PlainDate.from('2026-07-10'),
      defaultView: 'month',
      timeZone: 'America/Asuncion',
      weekStartsOn: 1,
    });

    expect(calendar.date.toString()).toBe('2026-07-10');
    expect(calendar.view).toBe('month');
    expect(calendar.visibleRange.start.toString()).toBe(
      '2026-06-29T00:00:00-03:00[America/Asuncion]',
    );
    expect(calendar.visibleRange.end.toString()).toBe(
      '2026-08-03T00:00:00-03:00[America/Asuncion]',
    );
  });

  it('navigates according to the active view and preserves the reference day', () => {
    const calendar = createCalendar({
      views: { month: true, week: true, day: true },
      date: Temporal.PlainDate.from('2026-07-10'),
      defaultView: 'month',
    });

    calendar.next();
    expect(calendar.date.toString()).toBe('2026-08-10');

    calendar.setView('week');
    calendar.previous();
    expect(calendar.date.toString()).toBe('2026-08-03');

    calendar.setView('day');
    calendar.next();
    expect(calendar.date.toString()).toBe('2026-08-04');
  });

  it('uses its timezone for the initial date and today()', () => {
    const timeZone = 'Pacific/Kiritimati';
    const expected = Temporal.Now.zonedDateTimeISO(timeZone).toPlainDate();
    const calendar = createCalendar({ views: { day: true }, timeZone });

    expect(calendar.date.equals(expected)).toBe(true);

    calendar.setDate(Temporal.PlainDate.from('2000-01-01'));
    calendar.today();
    expect(calendar.date.equals(expected)).toBe(true);
  });

  it('notifies subscribers after source state changes', () => {
    const calendar = createCalendar({
      views: { month: true, week: true },
      date: Temporal.PlainDate.from('2026-07-10'),
    });
    const listener = vi.fn();
    const unsubscribe = calendar.subscribe(listener);

    calendar.setDate(Temporal.PlainDate.from('2026-07-11'));
    calendar.setView('week');
    unsubscribe();
    calendar.next();

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('formats a title for the active view', () => {
    const calendar = createCalendar({
      views: { month: true },
      date: Temporal.PlainDate.from('2026-07-10'),
    });

    expect(calendar.title('en-US')).toBe('July 2026');
  });

  it('rejects invalid JavaScript configuration synchronously', () => {
    expect(() => createCalendar({ views: {} } as never)).toThrow(
      'Calendar requires at least one configured view',
    );
    expect(() => createCalendar({ views: { month: true }, defaultView: 'week' } as never)).toThrow(
      'Calendar view "week" is not configured',
    );
    expect(() => createCalendar({ views: { month: false } } as never)).toThrow(
      'Calendar view "month" must be true or an options object',
    );
    expect(() =>
      createCalendar({
        views: { week: { slotDuration: Temporal.Duration.from({ minutes: 0 }) } },
      }),
    ).toThrow('slotDuration must be positive');
    expect(() =>
      createCalendar({
        views: {
          day: {
            dayStart: Temporal.PlainTime.from('18:00'),
            dayEnd: Temporal.PlainTime.from('08:00'),
          },
        },
      }),
    ).toThrow('dayEnd must be after dayStart');
  });
});
