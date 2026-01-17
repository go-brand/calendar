import { Temporal } from '@js-temporal/polyfill';
import type { CalendarAccessor, CalendarDayView, TimeSlot } from '../types';

export function buildDay<T>(
  date: Temporal.PlainDate,
  options?: {
    startHour?: number;
    endHour?: number;
    slotDuration?: number;
    today?: Temporal.PlainDate;
    data?: T[];
    accessor?: CalendarAccessor<T>;
  }
): CalendarDayView<T> {
  const startHour = options?.startHour ?? 0;
  const endHour = options?.endHour ?? 24;
  const slotDuration = options?.slotDuration ?? 30;
  const today = options?.today ?? Temporal.Now.plainDateISO();
  const data = options?.data ?? [];
  const accessor = options?.accessor;

  const dayItems: T[] = [];

  if (accessor) {
    for (const item of data) {
      const itemDate = accessor.getDate(item);
      if (Temporal.PlainDate.compare(itemDate, date) === 0) {
        dayItems.push(item);
      }
    }
  }

  const timeSlots: TimeSlot<T>[] = [];
  let currentHour = startHour;
  let currentMinute = 0;

  while (currentHour < endHour) {
    const slotStart = Temporal.PlainTime.from({ hour: currentHour, minute: currentMinute });

    let nextMinute = currentMinute + slotDuration;
    let nextHour = currentHour;
    if (nextMinute >= 60) {
      nextHour += Math.floor(nextMinute / 60);
      nextMinute = nextMinute % 60;
    }

    const slotItems: T[] = [];
    if (accessor?.getStart) {
      for (const item of dayItems) {
        const itemStart = accessor.getStart(item);
        const itemTime = itemStart.toPlainTime();

        const slotEndHour = nextHour >= 24 ? 0 : nextHour;
        const slotEndMinute = nextHour >= 24 ? 0 : nextMinute;
        const slotEnd = Temporal.PlainTime.from({ hour: slotEndHour, minute: slotEndMinute });

        const isAfterStart = Temporal.PlainTime.compare(itemTime, slotStart) >= 0;
        const isBeforeEnd = nextHour >= 24
          ? Temporal.PlainTime.compare(itemTime, slotEnd) > 0
          : Temporal.PlainTime.compare(itemTime, slotEnd) < 0;

        if (isAfterStart && isBeforeEnd) {
          slotItems.push(item);
        }
      }
    }

    timeSlots.push({
      hour: currentHour,
      minute: currentMinute,
      time: slotStart,
      items: slotItems,
    });

    currentMinute += slotDuration;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return {
    date,
    isToday: Temporal.PlainDate.compare(date, today) === 0,
    timeSlots,
    items: dayItems,
  };
}
