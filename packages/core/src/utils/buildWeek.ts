import { Temporal } from '@js-temporal/polyfill';
import type { CalendarAccessor, CalendarWeekView, WeekDay } from '../types';
import { buildDay } from './buildDay';

export function buildWeek<T>(
  date: Temporal.PlainDate,
  options?: {
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    startHour?: number;
    endHour?: number;
    slotDuration?: number;
    today?: Temporal.PlainDate;
    data?: T[];
    accessor?: CalendarAccessor<T>;
  }
): CalendarWeekView<T> {
  const weekStartsOn = options?.weekStartsOn ?? 1;
  const startHour = options?.startHour;
  const endHour = options?.endHour;
  const slotDuration = options?.slotDuration;
  const today = options?.today ?? Temporal.Now.plainDateISO();
  const data = options?.data ?? [];
  const accessor = options?.accessor;

  const hasTimeSlots = startHour !== undefined && endHour !== undefined && slotDuration !== undefined;

  const itemsByDate = new Map<string, T[]>();
  if (accessor) {
    for (const item of data) {
      const date = accessor.getDate(item);
      const key = date.toString();
      const existing = itemsByDate.get(key) ?? [];
      itemsByDate.set(key, [...existing, item]);
    }
  }

  const dayOfWeek = date.dayOfWeek;
  const daysToSubtract = (dayOfWeek - weekStartsOn + 7) % 7;
  const weekStart = date.subtract({ days: daysToSubtract });

  const days: WeekDay<T>[] = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = weekStart.add({ days: i });
    const dateKey = currentDate.toString();

    let timeSlots = undefined;
    if (hasTimeSlots) {
      const dayView = buildDay(currentDate, {
        startHour,
        endHour,
        slotDuration,
        today,
        data,
        accessor,
      });
      timeSlots = dayView.timeSlots;
    }

    days.push({
      id: `${weekStart.toString()}-${dateKey}`,
      date: currentDate,
      isToday: Temporal.PlainDate.compare(currentDate, today) === 0,
      items: itemsByDate.get(dateKey) ?? [],
      timeSlots,
    });
  }

  const weekEnd = weekStart.add({ days: 6 });

  return {
    days,
    weekStart,
    weekEnd,
  };
}
