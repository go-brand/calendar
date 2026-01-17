import { Temporal } from '@js-temporal/polyfill';
import type { CalendarAccessor, CalendarMonth, CalendarWeek } from '../types';

export function buildMonth<T>(
  year: number,
  month: number,
  options?: {
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    today?: Temporal.PlainDate;
    data?: T[];
    accessor?: CalendarAccessor<T>;
  }
): CalendarMonth<T> {
  const weekStartsOn = options?.weekStartsOn ?? 1;
  const today = options?.today ?? Temporal.Now.plainDateISO();
  const data = options?.data ?? [];
  const accessor = options?.accessor;

  const yearMonth = Temporal.PlainYearMonth.from({ year, month });
  const firstOfMonth = yearMonth.toPlainDate({ day: 1 });
  const lastOfMonth = yearMonth.toPlainDate({ day: yearMonth.daysInMonth });

  const itemsByDate = new Map<string, T[]>();
  if (accessor) {
    for (const item of data) {
      const date = accessor.getDate(item);
      const key = date.toString();
      const existing = itemsByDate.get(key) ?? [];
      itemsByDate.set(key, [...existing, item]);
    }
  }

  let startDate = firstOfMonth;
  const firstDayOfWeek = firstOfMonth.dayOfWeek;
  const daysToSubtract = (firstDayOfWeek - weekStartsOn + 7) % 7;
  if (daysToSubtract > 0) {
    startDate = firstOfMonth.subtract({ days: daysToSubtract });
  }

  const weeks: CalendarWeek<T>[] = [];
  let currentDate = startDate;

  while (
    currentDate.month !== lastOfMonth.month ||
    currentDate.day <= lastOfMonth.day ||
    weeks.length === 0 ||
    weeks[weeks.length - 1].length < 7
  ) {
    if (weeks.length === 0 || weeks[weeks.length - 1].length === 7) {
      weeks.push([]);
    }

    const dateKey = currentDate.toString();
    weeks[weeks.length - 1].push({
      date: currentDate,
      isCurrentMonth: currentDate.month === month,
      isToday: Temporal.PlainDate.compare(currentDate, today) === 0,
      items: itemsByDate.get(dateKey) ?? [],
    });

    currentDate = currentDate.add({ days: 1 });

    if (weeks.length >= 6 && weeks[weeks.length - 1].length === 7) {
      break;
    }
  }

  return {
    weeks,
    month: yearMonth,
  };
}
