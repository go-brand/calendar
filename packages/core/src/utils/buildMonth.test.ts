import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { buildMonth } from './buildMonth';
import type { CalendarAccessor } from '../types';

type TestEvent = {
  id: string;
  date: string;
  title: string;
};

const testAccessor: CalendarAccessor<TestEvent> = {
  getDate: (item) => Temporal.PlainDate.from(item.date),
};

describe('buildMonth', () => {
  it('should build a month with correct number of weeks', () => {
    const result = buildMonth(2024, 1, { weekStartsOn: 1 });
    expect(result.weeks.length).toBeGreaterThanOrEqual(4);
    expect(result.weeks.length).toBeLessThanOrEqual(6);
  });

  it('should return correct month info', () => {
    const result = buildMonth(2024, 1, { weekStartsOn: 1 });
    expect(result.month.year).toBe(2024);
    expect(result.month.month).toBe(1);
  });

  it('should have 7 days per week', () => {
    const result = buildMonth(2024, 1, { weekStartsOn: 1 });
    result.weeks.forEach((week) => {
      expect(week).toHaveLength(7);
    });
  });

  it('should mark current month days correctly', () => {
    const result = buildMonth(2024, 1, { weekStartsOn: 1 });
    const januaryDays = result.weeks
      .flat()
      .filter((day) => day.isCurrentMonth);
    expect(januaryDays).toHaveLength(31); // January has 31 days
  });

  it('should include days from previous/next month to fill weeks', () => {
    const result = buildMonth(2024, 1, { weekStartsOn: 1 });
    const previousMonthDays = result.weeks
      .flat()
      .filter((day) => !day.isCurrentMonth && day.date.month === 12);
    const nextMonthDays = result.weeks
      .flat()
      .filter((day) => !day.isCurrentMonth && day.date.month === 2);

    expect(previousMonthDays.length + nextMonthDays.length).toBeGreaterThan(0);
  });

  it('should correctly identify today', () => {
    const today = Temporal.Now.plainDateISO();
    const result = buildMonth(today.year, today.month, {
      weekStartsOn: 1,
      today,
    });

    const todayDays = result.weeks
      .flat()
      .filter((day) => day.isToday);
    expect(todayDays).toHaveLength(1);
    expect(todayDays[0].date.toString()).toBe(today.toString());
  });

  it('should not mark any day as today when today is in different month', () => {
    const today = Temporal.PlainDate.from('2024-06-15');
    const result = buildMonth(2024, 1, {
      weekStartsOn: 1,
      today,
    });

    const todayDays = result.weeks
      .flat()
      .filter((day) => day.isToday);
    expect(todayDays).toHaveLength(0);
  });

  it('should handle week starting on Sunday', () => {
    const result = buildMonth(2024, 1, { weekStartsOn: 0 });
    const firstWeek = result.weeks[0];
    const firstDay = firstWeek[0];
    expect(firstDay.date.dayOfWeek % 7).toBe(0);
  });

  it('should handle week starting on Monday', () => {
    const result = buildMonth(2024, 1, { weekStartsOn: 1 });
    const firstWeek = result.weeks[0];
    const firstDay = firstWeek[0];
    expect(firstDay.date.dayOfWeek).toBe(1);
  });

  it('should assign events to correct dates', () => {
    const events: TestEvent[] = [
      { id: '1', date: '2024-01-15', title: 'Event 1' },
      { id: '2', date: '2024-01-15', title: 'Event 2' },
      { id: '3', date: '2024-01-20', title: 'Event 3' },
    ];

    const result = buildMonth(2024, 1, {
      weekStartsOn: 1,
      data: events,
      accessor: testAccessor,
    });

    const jan15 = result.weeks
      .flat()
      .find((day) => day.date.day === 15 && day.date.month === 1);
    const jan20 = result.weeks
      .flat()
      .find((day) => day.date.day === 20 && day.date.month === 1);

    expect(jan15?.items).toHaveLength(2);
    expect(jan20?.items).toHaveLength(1);
  });

  it('should return empty items array when no events provided', () => {
    const result = buildMonth(2024, 1, { weekStartsOn: 1 });
    result.weeks.flat().forEach((day) => {
      expect(day.items).toEqual([]);
    });
  });

  it('should handle month with 28 days (February non-leap)', () => {
    const result = buildMonth(2023, 2, { weekStartsOn: 1 });
    const februaryDays = result.weeks
      .flat()
      .filter((day) => day.isCurrentMonth);
    expect(februaryDays).toHaveLength(28);
  });

  it('should handle month with 29 days (February leap year)', () => {
    const result = buildMonth(2024, 2, { weekStartsOn: 1 });
    const februaryDays = result.weeks
      .flat()
      .filter((day) => day.isCurrentMonth);
    expect(februaryDays).toHaveLength(29);
  });

  it('should handle month with 30 days', () => {
    const result = buildMonth(2024, 4, { weekStartsOn: 1 });
    const aprilDays = result.weeks
      .flat()
      .filter((day) => day.isCurrentMonth);
    expect(aprilDays).toHaveLength(30);
  });

  it('should include events from previous/next month when they appear in calendar grid', () => {
    const events: TestEvent[] = [
      { id: '1', date: '2023-12-31', title: 'Previous Year' },
      { id: '2', date: '2024-01-15', title: 'Current Month' },
      { id: '3', date: '2024-02-01', title: 'Next Month' },
    ];

    const result = buildMonth(2024, 1, {
      weekStartsOn: 1, // Monday
      data: events,
      accessor: testAccessor,
    });

    // January 2024 starts on Monday (Jan 1 is Monday)
    // With Monday start: no previous month days needed
    // January ends on Wednesday (Jan 31 is Wednesday)
    // Grid should complete the final week, so includes Feb 1-4 (Thu-Sun)
    const allDays = result.weeks.flat();

    const jan15 = allDays.find((day) => day.date.day === 15 && day.date.month === 1);
    expect(jan15).toBeDefined();
    expect(jan15?.items).toHaveLength(1);
    expect(jan15?.items[0].title).toBe('Current Month');

    // Dec 31 is Sunday, Jan 1 is Monday - should NOT be in grid with Monday start
    const dec31 = allDays.find((day) => day.date.day === 31 && day.date.month === 12);
    expect(dec31).toBeUndefined();

    // Feb 1 is Thursday, should be in grid to complete final week
    const feb1 = allDays.find((day) => day.date.day === 1 && day.date.month === 2);
    expect(feb1).toBeDefined();
    expect(feb1?.items).toHaveLength(1);
    expect(feb1?.items[0].title).toBe('Next Month');
  });

  it('should include previous month events when month starts mid-week', () => {
    // February 2024 starts on Thursday (Feb 1)
    // With Monday start, grid should include Jan 29-31 (Mon-Wed)
    const events: TestEvent[] = [
      { id: '1', date: '2024-01-29', title: 'Monday before' },
      { id: '2', date: '2024-01-30', title: 'Tuesday before' },
      { id: '3', date: '2024-01-31', title: 'Wednesday before' },
      { id: '4', date: '2024-02-01', title: 'Feb starts' },
    ];

    const result = buildMonth(2024, 2, {
      weekStartsOn: 1,
      data: events,
      accessor: testAccessor,
    });

    const allDays = result.weeks.flat();

    const jan29 = allDays.find((d) => d.date.day === 29 && d.date.month === 1);
    expect(jan29).toBeDefined();
    expect(jan29?.items).toHaveLength(1);
    expect(jan29?.items[0].title).toBe('Monday before');

    const jan30 = allDays.find((d) => d.date.day === 30 && d.date.month === 1);
    expect(jan30).toBeDefined();
    expect(jan30?.items).toHaveLength(1);

    const jan31 = allDays.find((d) => d.date.day === 31 && d.date.month === 1);
    expect(jan31).toBeDefined();
    expect(jan31?.items).toHaveLength(1);

    const feb1 = allDays.find((d) => d.date.day === 1 && d.date.month === 2);
    expect(feb1).toBeDefined();
    expect(feb1?.items).toHaveLength(1);
    expect(feb1?.items[0].title).toBe('Feb starts');
  });

  it('should default to Monday when weekStartsOn not provided', () => {
    const result = buildMonth(2024, 1);
    const firstDay = result.weeks[0][0];
    expect(firstDay.date.dayOfWeek).toBe(1);
  });

  it('should use current date as today when not provided', () => {
    const today = Temporal.Now.plainDateISO();
    const result = buildMonth(today.year, today.month);

    const todayDays = result.weeks
      .flat()
      .filter((day) => day.isToday);

    if (todayDays.length > 0) {
      expect(todayDays[0].date.toString()).toBe(today.toString());
    }
  });

  it('should handle different week start days correctly', () => {
    const weekStarts = [0, 1, 2, 3, 4, 5, 6] as const;

    weekStarts.forEach((weekStart) => {
      const result = buildMonth(2024, 1, { weekStartsOn: weekStart });
      const firstDay = result.weeks[0][0];
      expect(firstDay.date.dayOfWeek % 7).toBe(weekStart);
    });
  });

  it('should always return exactly 6 weeks or less', () => {
    for (let month = 1; month <= 12; month++) {
      const result = buildMonth(2024, month, { weekStartsOn: 1 });
      expect(result.weeks.length).toBeLessThanOrEqual(6);
      expect(result.weeks.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('should group multiple events on same date', () => {
    const events: TestEvent[] = [
      { id: '1', date: '2024-01-15', title: 'Event 1' },
      { id: '2', date: '2024-01-15', title: 'Event 2' },
      { id: '3', date: '2024-01-15', title: 'Event 3' },
    ];

    const result = buildMonth(2024, 1, {
      weekStartsOn: 1,
      data: events,
      accessor: testAccessor,
    });

    const jan15 = result.weeks
      .flat()
      .find((day) => day.date.day === 15 && day.date.month === 1);

    expect(jan15?.items).toHaveLength(3);
    expect(jan15?.items.map((e) => e.id)).toEqual(['1', '2', '3']);
  });
});
