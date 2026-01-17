import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
  functionalUpdate,
  createCalendarAccessor,
  nextMonth,
  previousMonth,
  nextWeek,
  previousWeek,
  nextDay,
  previousDay,
  goToToday,
  getWeekdays,
  getMonthName,
  formatTime,
  getTimeSlotHeight,
  getEventPosition,
  convertToTimezone,
  getTimezoneOffset,
  createZonedDateTime,
  getCurrentTimeZone,
  getMonthRange,
  getWeekRange,
  getDayRange,
} from './utils';

describe('functionalUpdate', () => {
  it('should call updater function with input', () => {
    const input = { value: 1 };
    const updater = (old: { value: number }) => ({ value: old.value + 1 });
    const result = functionalUpdate(updater, input);
    expect(result).toEqual({ value: 2 });
  });

  it('should return value directly if not a function', () => {
    const input = { value: 1 };
    const value = { value: 5 };
    const result = functionalUpdate(value, input);
    expect(result).toEqual({ value: 5 });
  });
});

describe('createCalendarAccessor', () => {
  it('should return the accessor unchanged', () => {
    type TestItem = { date: string };
    const accessor = {
      getDate: (item: TestItem) => Temporal.PlainDate.from(item.date),
    };
    const result = createCalendarAccessor<TestItem>(accessor);
    expect(result).toBe(accessor);
  });
});

describe('nextMonth', () => {
  it('should return next month', () => {
    const month = Temporal.PlainYearMonth.from('2024-01');
    const result = nextMonth(month);
    expect(result.toString()).toBe('2024-02');
  });

  it('should wrap to next year', () => {
    const month = Temporal.PlainYearMonth.from('2024-12');
    const result = nextMonth(month);
    expect(result.toString()).toBe('2025-01');
  });
});

describe('previousMonth', () => {
  it('should return previous month', () => {
    const month = Temporal.PlainYearMonth.from('2024-02');
    const result = previousMonth(month);
    expect(result.toString()).toBe('2024-01');
  });

  it('should wrap to previous year', () => {
    const month = Temporal.PlainYearMonth.from('2024-01');
    const result = previousMonth(month);
    expect(result.toString()).toBe('2023-12');
  });
});

describe('nextWeek', () => {
  it('should return date 7 days later', () => {
    const date = Temporal.PlainDate.from('2024-01-01');
    const result = nextWeek(date);
    expect(result.toString()).toBe('2024-01-08');
  });

  it('should handle month boundary', () => {
    const date = Temporal.PlainDate.from('2024-01-29');
    const result = nextWeek(date);
    expect(result.toString()).toBe('2024-02-05');
  });
});

describe('previousWeek', () => {
  it('should return date 7 days earlier', () => {
    const date = Temporal.PlainDate.from('2024-01-08');
    const result = previousWeek(date);
    expect(result.toString()).toBe('2024-01-01');
  });

  it('should handle month boundary', () => {
    const date = Temporal.PlainDate.from('2024-02-05');
    const result = previousWeek(date);
    expect(result.toString()).toBe('2024-01-29');
  });
});

describe('nextDay', () => {
  it('should return next day', () => {
    const date = Temporal.PlainDate.from('2024-01-01');
    const result = nextDay(date);
    expect(result.toString()).toBe('2024-01-02');
  });

  it('should handle month boundary', () => {
    const date = Temporal.PlainDate.from('2024-01-31');
    const result = nextDay(date);
    expect(result.toString()).toBe('2024-02-01');
  });

  it('should handle year boundary', () => {
    const date = Temporal.PlainDate.from('2024-12-31');
    const result = nextDay(date);
    expect(result.toString()).toBe('2025-01-01');
  });
});

describe('previousDay', () => {
  it('should return previous day', () => {
    const date = Temporal.PlainDate.from('2024-01-02');
    const result = previousDay(date);
    expect(result.toString()).toBe('2024-01-01');
  });

  it('should handle month boundary', () => {
    const date = Temporal.PlainDate.from('2024-02-01');
    const result = previousDay(date);
    expect(result.toString()).toBe('2024-01-31');
  });

  it('should handle year boundary', () => {
    const date = Temporal.PlainDate.from('2025-01-01');
    const result = previousDay(date);
    expect(result.toString()).toBe('2024-12-31');
  });
});

describe('goToToday', () => {
  it('should return today year and month', () => {
    const result = goToToday();
    const today = Temporal.Now.plainDateISO();
    expect(result.year).toBe(today.year);
    expect(result.month).toBe(today.month);
  });
});

describe('getWeekdays', () => {
  it('should return 7 weekday names starting from Monday', () => {
    const result = getWeekdays(1);
    expect(result).toHaveLength(7);
    expect(result[0]).toBe('Mon');
    expect(result[6]).toBe('Sun');
  });

  it('should return 7 weekday names starting from Sunday', () => {
    const result = getWeekdays(0);
    expect(result).toHaveLength(7);
    expect(result[0]).toBe('Sun');
    expect(result[6]).toBe('Sat');
  });

  it('should return 7 weekday names starting from Wednesday', () => {
    const result = getWeekdays(3);
    expect(result).toHaveLength(7);
    expect(result[0]).toBe('Wed');
    expect(result[6]).toBe('Tue');
  });

  it('should default to Monday when no argument provided', () => {
    const result = getWeekdays();
    expect(result[0]).toBe('Mon');
  });

  describe('locale support', () => {
    it('should return weekdays in Spanish', () => {
      const result = getWeekdays(1, 'es-ES');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('lun');
      expect(result[6]).toBe('dom');
    });

    it('should return weekdays in French', () => {
      const result = getWeekdays(1, 'fr-FR');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('lun.');
      expect(result[6]).toBe('dim.');
    });

    it('should return weekdays in German', () => {
      const result = getWeekdays(1, 'de-DE');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Mo');
      expect(result[6]).toBe('So');
    });

    it('should support locale array', () => {
      const result = getWeekdays(1, ['es-ES', 'en-US']);
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('lun');
    });
  });

  describe('format support', () => {
    it('should return long format weekdays', () => {
      const result = getWeekdays(1, 'en-US', 'long');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Monday');
      expect(result[6]).toBe('Sunday');
    });

    it('should return narrow format weekdays', () => {
      const result = getWeekdays(1, 'en-US', 'narrow');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('M');
      expect(result[6]).toBe('S');
    });

    it('should combine different locale and format', () => {
      const result = getWeekdays(0, 'es-ES', 'long');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('domingo');
      expect(result[6]).toBe('sábado');
    });

    it('should work with French locale and long format', () => {
      const result = getWeekdays(1, 'fr-FR', 'long');
      expect(result[0]).toBe('lundi');
      expect(result[6]).toBe('dimanche');
    });

    it('should work with German locale and narrow format', () => {
      const result = getWeekdays(3, 'de-DE', 'narrow');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('M');
    });
  });

  describe('combined scenarios', () => {
    it('should work with Sunday start, Spanish locale, long format', () => {
      const result = getWeekdays(0, 'es-ES', 'long');
      expect(result[0]).toBe('domingo');
      expect(result[1]).toBe('lunes');
      expect(result).toHaveLength(7);
    });

    it('should work with Wednesday start, French locale, narrow format', () => {
      const result = getWeekdays(3, 'fr-FR', 'narrow');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('M');
    });

    it('should maintain backwards compatibility with single argument', () => {
      const result = getWeekdays(0);
      expect(result[0]).toBe('Sun');
      expect(result[1]).toBe('Mon');
    });
  });
});

describe('getMonthName', () => {
  it('should return month name', () => {
    const month = Temporal.PlainYearMonth.from('2024-01');
    const result = getMonthName(month);
    expect(result).toBe('January');
  });

  it('should return month name in different locale', () => {
    const month = Temporal.PlainYearMonth.from('2024-01');
    const result = getMonthName(month, 'es-ES');
    expect(result).toBe('enero');
  });
});

describe('formatTime', () => {
  it('should format time', () => {
    const time = Temporal.PlainTime.from('09:00');
    const result = formatTime(time);
    expect(result).toMatch(/9.*00/); // Matches formats like "9:00 AM" or "9:00"
  });

  it('should format afternoon time', () => {
    const time = Temporal.PlainTime.from('15:30');
    const result = formatTime(time);
    expect(result).toMatch(/3.*30|15.*30/); // Matches 12h or 24h format
  });
});

describe('getTimeSlotHeight', () => {
  it('should calculate time slot height for 30min slots', () => {
    const result = getTimeSlotHeight(30, 60);
    expect(result).toBe(30);
  });

  it('should calculate time slot height for 15min slots', () => {
    const result = getTimeSlotHeight(15, 60);
    expect(result).toBe(15);
  });

  it('should calculate time slot height for 60min slots', () => {
    const result = getTimeSlotHeight(60, 60);
    expect(result).toBe(60);
  });

  it('should handle different hour heights', () => {
    const result = getTimeSlotHeight(30, 100);
    expect(result).toBe(50);
  });
});

describe('getEventPosition', () => {
  it('should calculate event position and height', () => {
    const start = Temporal.ZonedDateTime.from('2024-01-01T09:00:00[America/New_York]');
    const end = Temporal.ZonedDateTime.from('2024-01-01T10:00:00[America/New_York]');
    const result = getEventPosition(start, end, 0, 60);
    expect(result.top).toBe(540); // 9 hours * 60px
    expect(result.height).toBe(60); // 1 hour * 60px
  });

  it('should handle events starting at different hour', () => {
    const start = Temporal.ZonedDateTime.from('2024-01-01T14:30:00[America/New_York]');
    const end = Temporal.ZonedDateTime.from('2024-01-01T15:30:00[America/New_York]');
    const result = getEventPosition(start, end, 8, 60);
    expect(result.top).toBe(390); // (14.5 - 8) * 60
    expect(result.height).toBe(60);
  });

  it('should handle 30 minute events', () => {
    const start = Temporal.ZonedDateTime.from('2024-01-01T10:00:00[America/New_York]');
    const end = Temporal.ZonedDateTime.from('2024-01-01T10:30:00[America/New_York]');
    const result = getEventPosition(start, end, 0, 60);
    expect(result.height).toBe(30);
  });
});

describe('convertToTimezone', () => {
  it('should convert datetime to different timezone', () => {
    const dateTime = Temporal.ZonedDateTime.from('2024-01-01T12:00:00[America/New_York]');
    const result = convertToTimezone(dateTime, 'America/Los_Angeles');
    expect(result.timeZoneId).toBe('America/Los_Angeles');
    expect(result.toPlainTime().hour).toBe(9); // 3 hours behind
  });

  it('should convert to UTC', () => {
    const dateTime = Temporal.ZonedDateTime.from('2024-01-01T12:00:00[America/New_York]');
    const result = convertToTimezone(dateTime, 'UTC');
    expect(result.timeZoneId).toBe('UTC');
    expect(result.toPlainTime().hour).toBe(17); // 5 hours ahead (EST)
  });
});

describe('getTimezoneOffset', () => {
  it('should return positive offset for timezone ahead of UTC', () => {
    const dateTime = Temporal.ZonedDateTime.from('2024-01-01T12:00:00[Europe/Paris]');
    const result = getTimezoneOffset(dateTime);
    expect(result).toBe('+1');
  });

  it('should return negative offset for timezone behind UTC', () => {
    const dateTime = Temporal.ZonedDateTime.from('2024-01-01T12:00:00[America/New_York]');
    const result = getTimezoneOffset(dateTime);
    expect(result).toBe('-5');
  });

  it('should return positive for UTC', () => {
    const dateTime = Temporal.ZonedDateTime.from('2024-01-01T12:00:00[UTC]');
    const result = getTimezoneOffset(dateTime);
    expect(result).toBe('+0');
  });
});

describe('createZonedDateTime', () => {
  it('should create ZonedDateTime from date and time', () => {
    const date = Temporal.PlainDate.from('2024-01-01');
    const time = Temporal.PlainTime.from('12:00');
    const result = createZonedDateTime(date, time, 'America/New_York');
    expect(result.year).toBe(2024);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.hour).toBe(12);
    expect(result.minute).toBe(0);
    expect(result.timeZoneId).toBe('America/New_York');
  });

  it('should create ZonedDateTime in different timezone', () => {
    const date = Temporal.PlainDate.from('2024-06-15');
    const time = Temporal.PlainTime.from('18:30');
    const result = createZonedDateTime(date, time, 'Europe/London');
    expect(result.timeZoneId).toBe('Europe/London');
  });
});

describe('getCurrentTimeZone', () => {
  it('should return current timezone ID', () => {
    const result = getCurrentTimeZone();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getMonthRange', () => {
  it('should return complete week-aligned month range for Europe/Madrid', () => {
    const { start, end } = getMonthRange('Europe/Madrid', 1);
    const now = Temporal.Now.zonedDateTimeISO('Europe/Madrid').toPlainDate();
    const firstOfMonth = now.with({ day: 1 });
    const lastOfMonth = now.with({ day: now.daysInMonth });

    expect(start.dayOfWeek).toBe(1); // Monday
    expect(end.dayOfWeek).toBe(7); // Sunday
    // start should be before or equal to first of month
    expect(Temporal.PlainDate.compare(start, firstOfMonth)).toBeLessThanOrEqual(0);
    // end should be after or equal to last of month
    expect(Temporal.PlainDate.compare(end, lastOfMonth)).toBeGreaterThanOrEqual(0);
  });

  it('should return complete week-aligned month range starting Sunday', () => {
    const { start, end } = getMonthRange('America/New_York', 0);

    expect(start.dayOfWeek).toBe(7); // Sunday (ISO week day 7)
    expect(end.dayOfWeek).toBe(6); // Saturday
  });

  it('should return different results for different timezones', () => {
    // When it's early morning in Asuncion but still previous day in NYC
    const asuncion = getMonthRange('America/Asuncion', 1);
    const madrid = getMonthRange('Europe/Madrid', 1);

    // Both should be valid ranges
    expect(asuncion.start).toBeInstanceOf(Temporal.PlainDate);
    expect(madrid.start).toBeInstanceOf(Temporal.PlainDate);
  });

  it('should default to current timezone', () => {
    const { start, end } = getMonthRange();
    const today = Temporal.Now.plainDateISO();

    expect(start.dayOfWeek).toBe(1); // Monday by default
    expect(end.dayOfWeek).toBe(7); // Sunday
    // The range should include today
    expect(Temporal.PlainDate.compare(start, today)).toBeLessThanOrEqual(0);
    expect(Temporal.PlainDate.compare(end, today)).toBeGreaterThanOrEqual(0);
  });
});

describe('getWeekRange', () => {
  it('should return complete week starting Monday', () => {
    const { start, end } = getWeekRange('Europe/Madrid', 1);

    expect(start.dayOfWeek).toBe(1); // Monday
    expect(end.dayOfWeek).toBe(7); // Sunday
    expect(end.since(start).days).toBe(6);
  });

  it('should return complete week starting Sunday', () => {
    const { start, end } = getWeekRange('America/New_York', 0);

    expect(start.dayOfWeek).toBe(7); // Sunday (ISO week day 7)
    expect(end.dayOfWeek).toBe(6); // Saturday
    expect(end.since(start).days).toBe(6);
  });

  it('should respect timezone when determining today', () => {
    const asuncion = getWeekRange('America/Asuncion', 1);
    const madrid = getWeekRange('Europe/Madrid', 1);

    // Both should return valid week ranges
    expect(asuncion.start.dayOfWeek).toBe(1);
    expect(madrid.start.dayOfWeek).toBe(1);
    expect(asuncion.end.since(asuncion.start).days).toBe(6);
    expect(madrid.end.since(madrid.start).days).toBe(6);
  });

  it('should default to current timezone and Monday start', () => {
    const { start, end } = getWeekRange();

    expect(start.dayOfWeek).toBe(1);
    expect(end.since(start).days).toBe(6);
  });
});

describe('getDayRange', () => {
  it('should return same day for start and end', () => {
    const { start, end } = getDayRange('Europe/Madrid');

    expect(start.equals(end)).toBe(true);
  });

  it('should respect timezone when determining today', () => {
    const asuncion = getDayRange('America/Asuncion');
    const madrid = getDayRange('Europe/Madrid');

    // Both should return valid dates
    expect(asuncion.start).toBeInstanceOf(Temporal.PlainDate);
    expect(madrid.start).toBeInstanceOf(Temporal.PlainDate);
  });

  it('should default to current timezone', () => {
    const { start, end } = getDayRange();

    expect(start).toBeInstanceOf(Temporal.PlainDate);
    expect(start.equals(end)).toBe(true);
  });
});
