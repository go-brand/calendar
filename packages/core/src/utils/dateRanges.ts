import { Temporal } from '@js-temporal/polyfill';
import type { DateRange } from '../types';

export type DateRangeBounds = 'calendar' | 'strict';

/**
 * Get the date range for a month view
 * @param date - Reference date (any date within the target month)
 * @param timeZone - IANA timezone identifier or 'UTC'
 * @param options - Optional configuration
 * @returns DateRange with start and end as ZonedDateTime
 */
export function getMonthDateRange(
  date: Temporal.PlainDate,
  timeZone: string,
  options?: {
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    bounds?: DateRangeBounds;
  }
): DateRange {
  const weekStartsOn = options?.weekStartsOn ?? 1;
  const bounds = options?.bounds ?? 'calendar';

  const firstOfMonth = date.with({ day: 1 });
  const lastOfMonth = date.with({ day: date.daysInMonth });

  let start: Temporal.PlainDate;
  let end: Temporal.PlainDate;

  if (bounds === 'calendar') {
    // Calendar grid: includes days from previous/next months to fill the grid
    const startDayOfWeek = firstOfMonth.dayOfWeek;
    const daysToSubtract = (startDayOfWeek - weekStartsOn + 7) % 7;
    start = firstOfMonth.subtract({ days: daysToSubtract });

    const endDayOfWeek = lastOfMonth.dayOfWeek;
    const daysToAdd = (weekStartsOn + 6 - endDayOfWeek) % 7;
    end = lastOfMonth.add({ days: daysToAdd });
  } else {
    // Strict: only the actual month days
    start = firstOfMonth;
    end = lastOfMonth;
  }

  const startZoned = start.toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from('00:00:00'),
  });
  const endZoned = end.toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from('23:59:59.999'),
  });

  return { start: startZoned, end: endZoned };
}

/**
 * Get the date range for a week view
 * @param date - Reference date (any date within the target week)
 * @param timeZone - IANA timezone identifier or 'UTC'
 * @param options - Optional configuration
 * @returns DateRange with start and end as ZonedDateTime
 */
export function getWeekDateRange(
  date: Temporal.PlainDate,
  timeZone: string,
  options?: {
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  }
): DateRange {
  const weekStartsOn = options?.weekStartsOn ?? 1;

  const dayOfWeek = date.dayOfWeek;
  const daysToSubtract = (dayOfWeek - weekStartsOn + 7) % 7;
  const start = date.subtract({ days: daysToSubtract });
  const end = start.add({ days: 6 });

  const startZoned = start.toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from('00:00:00'),
  });
  const endZoned = end.toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from('23:59:59.999'),
  });

  return { start: startZoned, end: endZoned };
}

/**
 * Get the date range for a day view
 * @param date - The target date
 * @param timeZone - IANA timezone identifier or 'UTC'
 * @returns DateRange with start and end as ZonedDateTime
 */
export function getDayDateRange(
  date: Temporal.PlainDate,
  timeZone: string
): DateRange {
  const startZoned = date.toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from('00:00:00'),
  });
  const endZoned = date.toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from('23:59:59.999'),
  });

  return { start: startZoned, end: endZoned };
}
