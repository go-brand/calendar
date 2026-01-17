import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { buildDay } from './buildDay';
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

describe('buildDay', () => {
  it('should return day view with correct date', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date);
    expect(result.date.toString()).toBe('2024-01-15');
  });

  it('should correctly identify today', () => {
    const today = Temporal.Now.plainDateISO();
    const result = buildDay(today, { today });
    expect(result.isToday).toBe(true);
  });

  it('should not mark as today when different date', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const today = Temporal.PlainDate.from('2024-06-15');
    const result = buildDay(date, { today });
    expect(result.isToday).toBe(false);
  });

  it('should default to 0-24 hours with 30min slots', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date);
    expect(result.timeSlots.length).toBe(48); // 24 hours * 2 (0:00-23:30)
    expect(result.timeSlots[0].hour).toBe(0);
    expect(result.timeSlots[result.timeSlots.length - 1].hour).toBe(23);
    expect(result.timeSlots[result.timeSlots.length - 1].minute).toBe(30);
  });

  it('should respect custom start and end hours', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      startHour: 9,
      endHour: 17,
      slotDuration: 30,
    });

    expect(result.timeSlots[0].hour).toBe(9);
    expect(result.timeSlots[0].minute).toBe(0);

    const lastSlot = result.timeSlots[result.timeSlots.length - 1];
    expect(lastSlot.hour).toBeLessThanOrEqual(17);
  });

  it('should respect custom slot duration', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      startHour: 9,
      endHour: 10,
      slotDuration: 15,
    });

    expect(result.timeSlots.length).toBe(4); // 1 hour with 15min slots (9:00, 9:15, 9:30, 9:45)
    expect(result.timeSlots[0].minute).toBe(0);
    expect(result.timeSlots[1].minute).toBe(15);
    expect(result.timeSlots[2].minute).toBe(30);
    expect(result.timeSlots[3].minute).toBe(45);
  });

  it('should create time slots with correct PlainTime objects', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      startHour: 9,
      endHour: 10,
      slotDuration: 30,
    });

    const slot1 = result.timeSlots[0];
    expect(slot1.time.hour).toBe(9);
    expect(slot1.time.minute).toBe(0);

    const slot2 = result.timeSlots[1];
    expect(slot2.time.hour).toBe(9);
    expect(slot2.time.minute).toBe(30);
  });

  it('should assign events to correct time slots', () => {
    const events: TestEvent[] = [
      {
        id: '1',
        date: '2024-01-15',
        start: '2024-01-15T09:00:00[UTC]',
        title: 'Event at 9am',
      },
      {
        id: '2',
        date: '2024-01-15',
        start: '2024-01-15T09:30:00[UTC]',
        title: 'Event at 9:30am',
      },
      {
        id: '3',
        date: '2024-01-15',
        start: '2024-01-15T14:00:00[UTC]',
        title: 'Event at 2pm',
      },
    ];

    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      startHour: 9,
      endHour: 15,
      slotDuration: 30,
      data: events,
      accessor: testAccessor,
    });

    const slot9am = result.timeSlots.find(
      (s) => s.hour === 9 && s.minute === 0
    );
    const slot930am = result.timeSlots.find(
      (s) => s.hour === 9 && s.minute === 30
    );
    const slot2pm = result.timeSlots.find(
      (s) => s.hour === 14 && s.minute === 0
    );

    expect(slot9am?.items).toHaveLength(1);
    expect(slot930am?.items).toHaveLength(1);
    expect(slot2pm?.items).toHaveLength(1);
  });

  it('should include all day events in items array', () => {
    const events: TestEvent[] = [
      { id: '1', date: '2024-01-15', title: 'All Day Event' },
      { id: '2', date: '2024-01-15', title: 'Another All Day' },
    ];

    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      data: events,
      accessor: testAccessor,
    });

    expect(result.items).toHaveLength(2);
  });

  it('should not include events from different dates', () => {
    const events: TestEvent[] = [
      { id: '1', date: '2024-01-14', title: 'Yesterday' },
      { id: '2', date: '2024-01-15', title: 'Today' },
      { id: '3', date: '2024-01-16', title: 'Tomorrow' },
    ];

    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      data: events,
      accessor: testAccessor,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('2');
  });

  it('should handle 60 minute slot duration', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      startHour: 9,
      endHour: 17,
      slotDuration: 60,
    });

    expect(result.timeSlots.length).toBe(8); // 9am to 4pm (9, 10, 11, 12, 13, 14, 15, 16)
    result.timeSlots.forEach((slot, index) => {
      expect(slot.hour).toBe(9 + index);
      expect(slot.minute).toBe(0);
    });
  });

  it('should handle slots crossing hour boundaries', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      startHour: 9,
      endHour: 11,
      slotDuration: 45,
    });

    expect(result.timeSlots[0].hour).toBe(9);
    expect(result.timeSlots[0].minute).toBe(0);

    expect(result.timeSlots[1].hour).toBe(9);
    expect(result.timeSlots[1].minute).toBe(45);

    expect(result.timeSlots[2].hour).toBe(10);
    expect(result.timeSlots[2].minute).toBe(30);
  });

  it('should return empty items when no events provided', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date);

    expect(result.items).toEqual([]);
    result.timeSlots.forEach((slot) => {
      expect(slot.items).toEqual([]);
    });
  });

  it('should not assign events to slots without getStart accessor', () => {
    const events: TestEvent[] = [
      { id: '1', date: '2024-01-15', title: 'Event' },
    ];

    const accessorWithoutStart: CalendarAccessor<TestEvent> = {
      getDate: (item) => Temporal.PlainDate.from(item.date),
    };

    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      startHour: 9,
      endHour: 17,
      slotDuration: 30,
      data: events,
      accessor: accessorWithoutStart,
    });

    result.timeSlots.forEach((slot) => {
      expect(slot.items).toEqual([]);
    });
  });

  it('should handle events at slot boundaries correctly', () => {
    const events: TestEvent[] = [
      {
        id: '1',
        date: '2024-01-15',
        start: '2024-01-15T09:00:00[UTC]',
        title: 'At start',
      },
      {
        id: '2',
        date: '2024-01-15',
        start: '2024-01-15T09:29:59[UTC]',
        title: 'Before end',
      },
    ];

    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      startHour: 9,
      endHour: 10,
      slotDuration: 30,
      data: events,
      accessor: testAccessor,
    });

    const slot = result.timeSlots.find((s) => s.hour === 9 && s.minute === 0);
    expect(slot?.items).toHaveLength(2);
  });

  it('should handle multiple events in same slot', () => {
    const events: TestEvent[] = [
      {
        id: '1',
        date: '2024-01-15',
        start: '2024-01-15T09:00:00[UTC]',
        title: 'Event 1',
      },
      {
        id: '2',
        date: '2024-01-15',
        start: '2024-01-15T09:15:00[UTC]',
        title: 'Event 2',
      },
      {
        id: '3',
        date: '2024-01-15',
        start: '2024-01-15T09:20:00[UTC]',
        title: 'Event 3',
      },
    ];

    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      startHour: 9,
      endHour: 10,
      slotDuration: 30,
      data: events,
      accessor: testAccessor,
    });

    const slot = result.timeSlots.find((s) => s.hour === 9 && s.minute === 0);
    expect(slot?.items).toHaveLength(3);
  });

  it('should use current date as today when not provided', () => {
    const today = Temporal.Now.plainDateISO();
    const result = buildDay(today);
    expect(result.isToday).toBe(true);
  });

  it('should handle single hour range', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      startHour: 9,
      endHour: 10,
      slotDuration: 30,
    });

    expect(result.timeSlots.length).toBe(2); // 9:00 and 9:30 (stops before 10:00)
  });

  it('should handle edge case with endHour at midnight', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      startHour: 0,
      endHour: 24,
      slotDuration: 60,
    });

    expect(result.timeSlots.length).toBe(24); // 0-23 (24 hours)
    expect(result.timeSlots[0].hour).toBe(0);
    expect(result.timeSlots[23].hour).toBe(23);
  });

  it('should properly sequence time slots', () => {
    const date = Temporal.PlainDate.from('2024-01-15');
    const result = buildDay(date, {
      startHour: 9,
      endHour: 12,
      slotDuration: 30,
    });

    for (let i = 1; i < result.timeSlots.length; i++) {
      const prev = result.timeSlots[i - 1].time;
      const current = result.timeSlots[i].time;
      const diff = current.since(prev).total('minutes');
      expect(diff).toBe(30);
    }
  });

  it('should handle events at 23:59 in the last hour slot', () => {
    const events: TestEvent[] = [
      {
        id: '1',
        date: '2026-01-15',
        start: '2026-01-15T11:00:00[Europe/Madrid]',
        title: 'Event at 12:00 PM',
      },
      {
        id: '2',
        date: '2026-01-15',
        start: '2026-01-15T23:59:00[Europe/Madrid]',
        title: 'Event at 11:59 PM',
      },
    ];

    const date = Temporal.PlainDate.from('2026-01-15');
    const result = buildDay(date, {
      startHour: 0,
      endHour: 24,
      slotDuration: 60,
      data: events,
      accessor: testAccessor,
    });

    const slot23 = result.timeSlots.find((s) => s.hour === 23);
    expect(slot23?.items).toHaveLength(1);
    expect(slot23?.items[0].title).toBe('Event at 11:59 PM');

    const slot11 = result.timeSlots.find((s) => s.hour === 11);
    expect(slot11?.items).toHaveLength(1);
    expect(slot11?.items[0].title).toBe('Event at 12:00 PM');
  });
});
