import type { Weekday } from '../types';

type TemporalType = 'PlainDate' | 'PlainTime' | 'ZonedDateTime' | 'Duration';

// Temporal objects carry their type in Symbol.toStringTag ("Temporal.PlainDate"),
// for both native Temporal and the polyfill, so this works where instanceof would not.
function typeName(value: unknown): string {
  return Object.prototype.toString.call(value).slice(8, -1);
}

export function expectTemporal(value: unknown, type: TemporalType, name: string) {
  const actual = typeName(value);
  if (actual !== `Temporal.${type}`) {
    throw new TypeError(`${name} must be a Temporal.${type}, got ${actual}`);
  }
}

export function expectWeekday(value: unknown): asserts value is Weekday {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 7) {
    throw new RangeError(
      `weekStartsOn must be 1 (Monday) through 7 (Sunday), got ${String(value)}`,
    );
  }
}
