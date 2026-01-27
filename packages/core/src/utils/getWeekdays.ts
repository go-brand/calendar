import { Temporal } from '@js-temporal/polyfill';

/**
 * Returns an array of weekday names starting from the specified day.
 *
 * @param weekStartsOn - Day the week starts on (0=Sunday, 1=Monday, ..., 6=Saturday). Defaults to 1 (Monday).
 * @param locale - Locale for formatting weekday names. Defaults to 'en-US'.
 * @param format - Format for weekday names: 'short' (Mon), 'long' (Monday), or 'narrow' (M). Defaults to 'short'.
 * @returns Array of 7 weekday names starting from weekStartsOn.
 */
export function getWeekdays(
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1,
  locale: string | string[] = 'en-US',
  format: 'short' | 'long' | 'narrow' = 'short'
): string[] {
  // 2023-01-01 is a Sunday (day 0), aligning with weekStartsOn convention
  const sunday = Temporal.PlainDate.from('2023-01-01');
  const days: string[] = [];

  for (let i = 0; i < 7; i++) {
    const date = sunday.add({ days: (weekStartsOn + i) % 7 });
    days.push(date.toLocaleString(locale, { weekday: format }));
  }

  return days;
}
