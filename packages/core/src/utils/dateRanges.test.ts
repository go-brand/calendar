import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, test } from 'vitest';
import { getMonthDateRange, getWeekDateRange, getDayDateRange } from './dateRanges';

describe('getMonthDateRange', () => {
  test('returns calendar bounds (default) including previous/next month days', () => {
    // January 2026 starts on Thursday
    // With weekStartsOn=1 (Monday), calendar should start on Dec 29, 2025
    const date = Temporal.PlainDate.from('2026-01-15');
    const range = getMonthDateRange(date, 'UTC', { weekStartsOn: 1 });

    expect(range.start.toPlainDate().toString()).toBe('2025-12-29');
    expect(range.end.toPlainDate().toString()).toBe('2026-02-01');
  });

  test('returns strict bounds when specified', () => {
    const date = Temporal.PlainDate.from('2026-01-15');
    const range = getMonthDateRange(date, 'UTC', {
      weekStartsOn: 1,
      bounds: 'strict'
    });

    expect(range.start.toPlainDate().toString()).toBe('2026-01-01');
    expect(range.end.toPlainDate().toString()).toBe('2026-01-31');
  });

  test('applies timezone correctly', () => {
    const date = Temporal.PlainDate.from('2026-01-15');
    const range = getMonthDateRange(date, 'America/New_York', { bounds: 'strict' });

    expect(range.start.timeZoneId).toBe('America/New_York');
    expect(range.end.timeZoneId).toBe('America/New_York');
  });

  test('sets time boundaries correctly', () => {
    const date = Temporal.PlainDate.from('2026-01-15');
    const range = getMonthDateRange(date, 'UTC', { bounds: 'strict' });

    expect(range.start.toPlainTime().toString()).toBe('00:00:00');
    expect(range.end.toPlainTime().toString()).toBe('23:59:59.999');
  });

  test('respects weekStartsOn option', () => {
    // January 2026 starts on Thursday
    // With weekStartsOn=0 (Sunday), calendar should start on Dec 28, 2025
    const date = Temporal.PlainDate.from('2026-01-15');
    const range = getMonthDateRange(date, 'UTC', { weekStartsOn: 0 });

    expect(range.start.toPlainDate().toString()).toBe('2025-12-28');
  });
});

describe('getWeekDateRange', () => {
  test('returns week range starting on Monday by default', () => {
    // Jan 16, 2026 is a Friday
    // Week should be Jan 12 (Mon) to Jan 18 (Sun)
    const date = Temporal.PlainDate.from('2026-01-16');
    const range = getWeekDateRange(date, 'UTC', { weekStartsOn: 1 });

    expect(range.start.toPlainDate().toString()).toBe('2026-01-12');
    expect(range.end.toPlainDate().toString()).toBe('2026-01-18');
  });

  test('respects weekStartsOn option', () => {
    // Jan 16, 2026 is a Friday
    // Week starting Sunday should be Jan 12 (Sun) to Jan 18 (Sat)
    const date = Temporal.PlainDate.from('2026-01-16');
    const range = getWeekDateRange(date, 'UTC', { weekStartsOn: 0 });

    expect(range.start.toPlainDate().toString()).toBe('2026-01-11');
    expect(range.end.toPlainDate().toString()).toBe('2026-01-17');
  });

  test('applies timezone correctly', () => {
    const date = Temporal.PlainDate.from('2026-01-16');
    const range = getWeekDateRange(date, 'Europe/Madrid');

    expect(range.start.timeZoneId).toBe('Europe/Madrid');
    expect(range.end.timeZoneId).toBe('Europe/Madrid');
  });

  test('sets time boundaries correctly', () => {
    const date = Temporal.PlainDate.from('2026-01-16');
    const range = getWeekDateRange(date, 'UTC');

    expect(range.start.toPlainTime().toString()).toBe('00:00:00');
    expect(range.end.toPlainTime().toString()).toBe('23:59:59.999');
  });
});

describe('getDayDateRange', () => {
  test('returns range for single day', () => {
    const date = Temporal.PlainDate.from('2026-01-16');
    const range = getDayDateRange(date, 'UTC');

    expect(range.start.toPlainDate().toString()).toBe('2026-01-16');
    expect(range.end.toPlainDate().toString()).toBe('2026-01-16');
  });

  test('applies timezone correctly', () => {
    const date = Temporal.PlainDate.from('2026-01-16');
    const range = getDayDateRange(date, 'Asia/Tokyo');

    expect(range.start.timeZoneId).toBe('Asia/Tokyo');
    expect(range.end.timeZoneId).toBe('Asia/Tokyo');
  });

  test('sets time boundaries correctly', () => {
    const date = Temporal.PlainDate.from('2026-01-16');
    const range = getDayDateRange(date, 'UTC');

    expect(range.start.toPlainTime().toString()).toBe('00:00:00');
    expect(range.end.toPlainTime().toString()).toBe('23:59:59.999');
  });
});
