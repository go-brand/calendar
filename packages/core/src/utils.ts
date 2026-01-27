import { Temporal } from '@js-temporal/polyfill';
import type { CalendarAccessor } from './types';

export function functionalUpdate<T>(updater: T | ((old: T) => T), input: T): T {
  return typeof updater === 'function' ? (updater as (old: T) => T)(input) : updater;
}

export function createCalendarAccessor<T, A extends CalendarAccessor<T> = CalendarAccessor<T>>(
  accessor: A
): A {
  return accessor;
}

export function nextMonth(month: Temporal.PlainYearMonth): Temporal.PlainYearMonth {
  return month.add({ months: 1 });
}

export function previousMonth(month: Temporal.PlainYearMonth): Temporal.PlainYearMonth {
  return month.subtract({ months: 1 });
}

export function nextWeek(date: Temporal.PlainDate): Temporal.PlainDate {
  return date.add({ weeks: 1 });
}

export function previousWeek(date: Temporal.PlainDate): Temporal.PlainDate {
  return date.subtract({ weeks: 1 });
}

export function nextDay(date: Temporal.PlainDate): Temporal.PlainDate {
  return date.add({ days: 1 });
}

export function previousDay(date: Temporal.PlainDate): Temporal.PlainDate {
  return date.subtract({ days: 1 });
}

export function goToToday(): { year: number; month: number } {
  const today = Temporal.Now.plainDateISO();
  return { year: today.year, month: today.month };
}


export function getMonthName(month: Temporal.PlainYearMonth, locale = 'en-US'): string {
  return month.toPlainDate({ day: 1 }).toLocaleString(locale, { month: 'long' });
}

export function formatTime(time: Temporal.PlainTime, locale = 'en-US'): string {
  const date = Temporal.PlainDate.from('2023-01-01');
  const dateTime = date.toPlainDateTime(time);
  return dateTime.toLocaleString(locale, { hour: 'numeric', minute: '2-digit' });
}

export function getTimeSlotHeight(slotDuration: number, hourHeight: number): number {
  return (slotDuration / 60) * hourHeight;
}

export function getEventPosition(
  eventStart: Temporal.ZonedDateTime,
  eventEnd: Temporal.ZonedDateTime,
  dayStart: number,
  hourHeight: number
): { top: number; height: number } {
  const startTime = eventStart.toPlainTime();
  const endTime = eventEnd.toPlainTime();

  const startMinutes = startTime.hour * 60 + startTime.minute;
  const endMinutes = endTime.hour * 60 + endTime.minute;
  const dayStartMinutes = dayStart * 60;

  const top = ((startMinutes - dayStartMinutes) / 60) * hourHeight;
  const height = ((endMinutes - startMinutes) / 60) * hourHeight;

  return { top, height };
}

export function convertToTimezone(
  dateTime: Temporal.ZonedDateTime,
  timeZone: string
): Temporal.ZonedDateTime {
  return dateTime.withTimeZone(timeZone);
}

export function getTimezoneOffset(dateTime: Temporal.ZonedDateTime): string {
  return dateTime.offsetNanoseconds / 3600000000000 >= 0
    ? `+${Math.floor(dateTime.offsetNanoseconds / 3600000000000)}`
    : `${Math.floor(dateTime.offsetNanoseconds / 3600000000000)}`;
}

export function createZonedDateTime(
  date: Temporal.PlainDate,
  time: Temporal.PlainTime,
  timeZone: string
): Temporal.ZonedDateTime {
  return date.toZonedDateTime({ timeZone, plainTime: time });
}

export function getCurrentTimeZone(): string {
  return Temporal.Now.timeZoneId();
}

export function getMonthRange(
  timeZone: string = getCurrentTimeZone(),
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1
): { start: Temporal.PlainDate; end: Temporal.PlainDate } {
  const today = Temporal.Now.zonedDateTimeISO(timeZone).toPlainDate();
  const firstOfMonth = today.with({ day: 1 });
  const lastOfMonth = today.with({ day: today.daysInMonth });

  const startDayOfWeek = firstOfMonth.dayOfWeek;
  const daysToSubtract = (startDayOfWeek - weekStartsOn + 7) % 7;
  const start = firstOfMonth.subtract({ days: daysToSubtract });

  const endDayOfWeek = lastOfMonth.dayOfWeek;
  const daysToAdd = (weekStartsOn + 6 - endDayOfWeek) % 7;
  const end = lastOfMonth.add({ days: daysToAdd });

  return { start, end };
}

export function getWeekRange(
  timeZone: string = getCurrentTimeZone(),
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1
): { start: Temporal.PlainDate; end: Temporal.PlainDate } {
  const today = Temporal.Now.zonedDateTimeISO(timeZone).toPlainDate();
  const dayOfWeek = today.dayOfWeek;
  const daysToSubtract = (dayOfWeek - weekStartsOn + 7) % 7;
  const start = today.subtract({ days: daysToSubtract });
  const end = start.add({ days: 6 });

  return { start, end };
}

export function getDayRange(
  timeZone: string = getCurrentTimeZone()
): { start: Temporal.PlainDate; end: Temporal.PlainDate } {
  const today = Temporal.Now.zonedDateTimeISO(timeZone).toPlainDate();
  return { start: today, end: today };
}
