import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { buildWeek } from './buildWeek';
import type { CalendarAccessor } from '../types';

type TestEvent = {
  id: string;
  date: string;
  start?: string;
  title: string;
};

const testAccessor: CalendarAccessor<TestEvent> = {
  getDate: (item) => Temporal.PlainDate.from(item.date),
  getStart: (item) =>
    item.start
      ? Temporal.ZonedDateTime.from(item.start)
      : Temporal.PlainDate.from(item.date).toZonedDateTime({
          timeZone: 'UTC',
          plainTime: '00:00',
        }),
};

describe('buildWeek', () => {
  it('should return 7 days', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildWeek(date, { weekStartsOn: 1 });
    expect(result.days).toHaveLength(7);
  });

  it('should start week on Monday when weekStartsOn is 1', () => {
    const date = Temporal.PlainDate.from('2024-01-15'); // Monday
    const result = buildWeek(date, { weekStartsOn: 1 });
    expect(result.weekStart.dayOfWeek).toBe(1);
    expect(result.days[0].date.dayOfWeek).toBe(1);
  });

  it('should start week on Sunday when weekStartsOn is 0', () => {
    const date = Temporal.PlainDate.from('2024-01-15'); // Monday
    const result = buildWeek(date, { weekStartsOn: 0 });
    expect(result.weekStart.dayOfWeek % 7).toBe(0);
    expect(result.days[0].date.dayOfWeek % 7).toBe(0);
  });

  it('should set weekEnd to 6 days after weekStart', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildWeek(date, { weekStartsOn: 1 });
    const diff = result.weekEnd.since(result.weekStart).days;
    expect(diff).toBe(6);
  });

  it('should correctly identify today', () => {
    const today = Temporal.Now.plainDateISO();
    const result = buildWeek(today, {
      weekStartsOn: 1,
      today,
    });

    const todayDays = result.days.filter((day) => day.isToday);
    expect(todayDays).toHaveLength(1);
    expect(todayDays[0].date.toString()).toBe(today.toString());
  });

  it('should assign events to correct dates', () => {
    const events: TestEvent[] = [
      { id: '1', date: '2024-01-15', title: 'Event 1' },
      { id: '2', date: '2024-01-16', title: 'Event 2' },
    ];

    const date = Temporal.PlainDate.from('2024-01-15'); // Monday
    const result = buildWeek(date, {
      weekStartsOn: 1,
      data: events,
      accessor: testAccessor,
    });

    const monday = result.days[0]; // 2024-01-15
    const tuesday = result.days[1]; // 2024-01-16

    expect(monday.items).toHaveLength(1);
    expect(tuesday.items).toHaveLength(1);
  });

  it('should return empty items when no events provided', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildWeek(date, { weekStartsOn: 1 });

    result.days.forEach((day) => {
      expect(day.items).toEqual([]);
    });
  });

  it('should not include timeSlots when time options not provided', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildWeek(date, { weekStartsOn: 1 });

    result.days.forEach((day) => {
      expect(day.timeSlots).toBeUndefined();
    });
  });

  it('should include timeSlots when time options provided', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildWeek(date, {
      weekStartsOn: 1,
      startHour: 9,
      endHour: 17,
      slotDuration: 30,
    });

    result.days.forEach((day) => {
      expect(day.timeSlots).toBeDefined();
      expect(day.timeSlots!.length).toBeGreaterThan(0);
    });
  });

  it('should handle week crossing month boundary', () => {
    const date = Temporal.PlainDate.from('2024-01-29'); // Monday
    const result = buildWeek(date, { weekStartsOn: 1 });

    expect(result.weekStart.month).toBe(1);
    expect(result.weekEnd.month).toBe(2);

    const januaryDays = result.days.filter((day) => day.date.month === 1);
    const februaryDays = result.days.filter((day) => day.date.month === 2);

    expect(januaryDays.length + februaryDays.length).toBe(7);
  });

  it('should handle week crossing year boundary', () => {
    const date = Temporal.PlainDate.from('2024-12-30'); // Monday
    const result = buildWeek(date, { weekStartsOn: 1 });

    expect(result.weekStart.year).toBe(2024);
    expect(result.weekEnd.year).toBe(2025);
  });

  it('should default to Monday when weekStartsOn not provided', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildWeek(date);
    expect(result.weekStart.dayOfWeek).toBe(1);
  });

  it('should use current date as today when not provided', () => {
    const today = Temporal.Now.plainDateISO();
    const result = buildWeek(today);

    const todayDays = result.days.filter((day) => day.isToday);
    expect(todayDays).toHaveLength(1);
  });

  it('should group multiple events on same date', () => {
    const events: TestEvent[] = [
      { id: '1', date: '2024-01-15', title: 'Event 1' },
      { id: '2', date: '2024-01-15', title: 'Event 2' },
      { id: '3', date: '2024-01-15', title: 'Event 3' },
    ];

    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildWeek(date, {
      weekStartsOn: 1,
      data: events,
      accessor: testAccessor,
    });

    const monday = result.days[0];
    expect(monday.items).toHaveLength(3);
    expect(monday.items.map((e) => e.id)).toEqual(['1', '2', '3']);
  });

  it('should handle different week start days', () => {
    const date = Temporal.PlainDate.from('2024-01-15'); // Monday
    const weekStarts = [0, 1, 2, 3, 4, 5, 6] as const;

    weekStarts.forEach((weekStart) => {
      const result = buildWeek(date, { weekStartsOn: weekStart });
      expect(result.days).toHaveLength(7);
      expect(result.days[0].date.dayOfWeek % 7).toBe(weekStart);
    });
  });

  it('should calculate weekStart correctly for date in middle of week', () => {
    const thursday = Temporal.PlainDate.from('2024-01-18'); // Thursday
    const result = buildWeek(thursday, { weekStartsOn: 1 }); // Week starts Monday

    expect(result.weekStart.day).toBe(15); // Monday Jan 15
    expect(result.weekEnd.day).toBe(21); // Sunday Jan 21
  });

  it('should include days in sequential order', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildWeek(date, { weekStartsOn: 1 });

    for (let i = 1; i < result.days.length; i++) {
      const prevDay = result.days[i - 1].date;
      const currentDay = result.days[i].date;
      const diff = currentDay.since(prevDay).days;
      expect(diff).toBe(1);
    }
  });

  it('should handle time slots with events', () => {
    const events: TestEvent[] = [
      {
        id: '1',
        date: '2024-01-15',
        start: '2024-01-15T09:30:00[UTC]',
        title: 'Morning Event',
      },
      {
        id: '2',
        date: '2024-01-15',
        start: '2024-01-15T14:00:00[UTC]',
        title: 'Afternoon Event',
      },
    ];

    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildWeek(date, {
      weekStartsOn: 1,
      startHour: 9,
      endHour: 17,
      slotDuration: 30,
      data: events,
      accessor: testAccessor,
    });

    const monday = result.days[0];
    expect(monday.timeSlots).toBeDefined();

    const totalEventsInSlots = monday.timeSlots!.reduce(
      (sum, slot) => sum + slot.items.length,
      0
    );
    expect(totalEventsInSlots).toBeGreaterThan(0);
  });

  it('should not mark any day as today when today is in different week', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const today = Temporal.PlainDate.from('2024-06-15');
    const result = buildWeek(date, {
      weekStartsOn: 1,
      today,
    });

    const todayDays = result.days.filter((day) => day.isToday);
    expect(todayDays).toHaveLength(0);
  });
});
