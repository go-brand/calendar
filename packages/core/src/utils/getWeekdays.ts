import { Temporal } from '@js-temporal/polyfill';
import type { Weekday } from '../types';

/**
 * Returns an array of weekday names starting from the specified day.
 *
 * @param weekStartsOn - Temporal dayOfWeek value (1=Monday, ..., 7=Sunday). Defaults to 1 (Monday).
 * @param locale - Locale for formatting weekday names. Defaults to 'en-US'.
 * @param format - Format for weekday names: 'short' (Mon), 'long' (Monday), or 'narrow' (M). Defaults to 'short'.
 * @returns Array of 7 weekday names starting from weekStartsOn.
 */
export function getWeekdays(
  weekStartsOn: Weekday = 1,
  locale: string | string[] = 'en-US',
  format: 'short' | 'long' | 'narrow' = 'short'
): string[] {
  const monday = Temporal.PlainDate.from('2023-01-02');
  const days: string[] = [];

  for (let i = 0; i < 7; i++) {
    const date = monday.add({ days: weekStartsOn - 1 + i });
    days.push(date.toLocaleString(locale, { weekday: format }));
  }

  return days;
}
