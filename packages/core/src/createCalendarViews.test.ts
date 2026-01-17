import { Temporal } from '@js-temporal/polyfill';
import { describe, it, expect, expectTypeOf } from 'vitest';
import { createCalendarViews } from './createCalendarViews';
import type { CalendarAccessor, MonthViewOptions, WeekViewOptions, DayViewOptions } from './types';

type TestItem = {
  date: Temporal.PlainDate;
  start: Temporal.ZonedDateTime;
};

describe('createCalendarViews', () => {
  it('creates a views configuration object', () => {
    const accessor: CalendarAccessor<TestItem> = {
      getDate: (item) => item.date,
      getStart: (item) => item.start,
    };

    const views = createCalendarViews<TestItem>()({
      month: { accessor },
      week: { accessor, startHour: 0, endHour: 24, slotDuration: 60 },
      day: { accessor, startHour: 0, endHour: 24, slotDuration: 60 },
    });

    expect(views).toHaveProperty('month');
    expect(views).toHaveProperty('week');
    expect(views).toHaveProperty('day');
    expect(views.month.accessor).toBe(accessor);
    expect(views.week.accessor).toBe(accessor);
    expect(views.day.accessor).toBe(accessor);
  });

  it('preserves exact type information', () => {
    const accessor: CalendarAccessor<TestItem> = {
      getDate: (item) => item.date,
      getStart: (item) => item.start,
    };

    const views = createCalendarViews<TestItem>()({
      month: { accessor, weekStartsOn: 1 },
      week: { accessor, startHour: 9, endHour: 17, slotDuration: 30 },
    });

    expectTypeOf(views).toHaveProperty('month');
    expectTypeOf(views).toHaveProperty('week');
    expectTypeOf(views.month).toMatchTypeOf<MonthViewOptions<TestItem>>();
    expectTypeOf(views.week).toMatchTypeOf<WeekViewOptions<TestItem>>();
  });

  it('supports custom view configurations', () => {
    const accessor: CalendarAccessor<TestItem> = {
      getDate: (item) => item.date,
    };

    const views = createCalendarViews<TestItem>()({
      month: { accessor },
    });

    expectTypeOf(views).toHaveProperty('month');
    expectTypeOf(views.month).toMatchTypeOf<MonthViewOptions<TestItem>>();
  });

  it('infers view names correctly', () => {
    const accessor: CalendarAccessor<TestItem> = {
      getDate: (item) => item.date,
    };

    const views = createCalendarViews<TestItem>()({
      month: { accessor },
      week: { accessor, startHour: 0, endHour: 24 },
      day: { accessor, startHour: 0, endHour: 24 },
    });

    type ViewNames = keyof typeof views;
    expectTypeOf<ViewNames>().toEqualTypeOf<'month' | 'week' | 'day'>();
  });

  it('provides access to individual view configs', () => {
    const accessor: CalendarAccessor<TestItem> = {
      getDate: (item) => item.date,
    };

    const views = createCalendarViews<TestItem>()({
      month: { accessor, weekStartsOn: 1 },
      week: { accessor, startHour: 0, endHour: 24, slotDuration: 60 },
    });

    type MonthConfig = typeof views['month'];
    type WeekConfig = typeof views['week'];

    expectTypeOf<MonthConfig>().toMatchTypeOf<MonthViewOptions<TestItem>>();
    expectTypeOf<WeekConfig>().toMatchTypeOf<WeekViewOptions<TestItem>>();
  });
});
