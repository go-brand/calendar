import { describe, it, expect } from 'vitest';
import { getWeekdays } from './getWeekdays';

describe('getWeekdays', () => {
  describe('weekStartsOn parameter', () => {
    it('should return 7 weekday names starting from Monday (1)', () => {
      const result = getWeekdays(1);
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Mon');
      expect(result[6]).toBe('Sun');
    });

    it('should return 7 weekday names starting from Sunday (0)', () => {
      const result = getWeekdays(0);
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Sun');
      expect(result[6]).toBe('Sat');
    });

    it('should return 7 weekday names starting from Tuesday (2)', () => {
      const result = getWeekdays(2);
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Tue');
      expect(result[6]).toBe('Mon');
    });

    it('should return 7 weekday names starting from Wednesday (3)', () => {
      const result = getWeekdays(3);
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Wed');
      expect(result[6]).toBe('Tue');
    });

    it('should return 7 weekday names starting from Thursday (4)', () => {
      const result = getWeekdays(4);
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Thu');
      expect(result[6]).toBe('Wed');
    });

    it('should return 7 weekday names starting from Friday (5)', () => {
      const result = getWeekdays(5);
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Fri');
      expect(result[6]).toBe('Thu');
    });

    it('should return 7 weekday names starting from Saturday (6)', () => {
      const result = getWeekdays(6);
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Sat');
      expect(result[6]).toBe('Fri');
    });

    it('should default to Monday when no argument provided', () => {
      const result = getWeekdays();
      expect(result[0]).toBe('Mon');
      expect(result[6]).toBe('Sun');
    });
  });

  describe('sequence correctness', () => {
    it('should return days in correct sequential order for Sunday start', () => {
      const result = getWeekdays(0);
      expect(result).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    });

    it('should return days in correct sequential order for Monday start', () => {
      const result = getWeekdays(1);
      expect(result).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    });

    it('should return days in correct sequential order for Saturday start', () => {
      const result = getWeekdays(6);
      expect(result).toEqual(['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    });

    it('should wrap around correctly for all start days', () => {
      const weekStarts = [0, 1, 2, 3, 4, 5, 6] as const;
      const longDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      weekStarts.forEach((start) => {
        const result = getWeekdays(start, 'en-US', 'long');
        expect(result).toHaveLength(7);

        // Verify each day is in correct position
        for (let i = 0; i < 7; i++) {
          const expectedDay = longDays[(start + i) % 7];
          expect(result[i]).toBe(expectedDay);
        }
      });
    });
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

    it('should return weekdays in Japanese', () => {
      const result = getWeekdays(0, 'ja-JP');
      expect(result).toHaveLength(7);
      // Japanese week typically starts Sunday
      expect(result[0]).toBe('日');
    });

    it('should return weekdays in Chinese', () => {
      const result = getWeekdays(1, 'zh-CN');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('周一');
    });

    it('should return weekdays in Arabic', () => {
      const result = getWeekdays(0, 'ar-SA');
      expect(result).toHaveLength(7);
      // Arabic starts with Sunday (الأحد)
      expect(result[0]).toContain('الأحد');
    });

    it('should support locale array with fallback', () => {
      const result = getWeekdays(1, ['es-ES', 'en-US']);
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('lun');
    });

    it('should fall back to second locale if first is invalid', () => {
      // Using a very obscure/invalid locale followed by en-US
      const result = getWeekdays(1, ['en-US']);
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Mon');
    });
  });

  describe('format support', () => {
    it('should return short format weekdays (default)', () => {
      const result = getWeekdays(1, 'en-US', 'short');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Mon');
      expect(result[6]).toBe('Sun');
    });

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

    it('should return long format in Spanish', () => {
      const result = getWeekdays(0, 'es-ES', 'long');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('domingo');
      expect(result[6]).toBe('sábado');
    });

    it('should return narrow format in French', () => {
      const result = getWeekdays(1, 'fr-FR', 'narrow');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('L');
    });

    it('should return long format in German', () => {
      const result = getWeekdays(1, 'de-DE', 'long');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Montag');
      expect(result[6]).toBe('Sonntag');
    });

    it('should return narrow format in German', () => {
      const result = getWeekdays(3, 'de-DE', 'narrow');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('M'); // Mittwoch
    });
  });

  describe('combined parameters', () => {
    it('should work with Sunday start, Spanish locale, long format', () => {
      const result = getWeekdays(0, 'es-ES', 'long');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('domingo');
      expect(result[1]).toBe('lunes');
      expect(result[6]).toBe('sábado');
    });

    it('should work with Wednesday start, French locale, narrow format', () => {
      const result = getWeekdays(3, 'fr-FR', 'narrow');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('M'); // mercredi
    });

    it('should work with Saturday start, German locale, short format', () => {
      const result = getWeekdays(6, 'de-DE', 'short');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('Sa');
      expect(result[1]).toBe('So');
      expect(result[6]).toBe('Fr');
    });

    it('should work with Friday start, Japanese locale, long format', () => {
      const result = getWeekdays(5, 'ja-JP', 'long');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('金曜日');
    });
  });

  describe('default values', () => {
    it('should default weekStartsOn to Monday (1)', () => {
      const withDefault = getWeekdays();
      const explicit = getWeekdays(1);
      expect(withDefault).toEqual(explicit);
    });

    it('should default locale to en-US', () => {
      const withDefault = getWeekdays(1);
      const explicit = getWeekdays(1, 'en-US');
      expect(withDefault).toEqual(explicit);
    });

    it('should default format to short', () => {
      const withDefault = getWeekdays(1, 'en-US');
      const explicit = getWeekdays(1, 'en-US', 'short');
      expect(withDefault).toEqual(explicit);
    });

    it('should use all defaults correctly', () => {
      const result = getWeekdays();
      expect(result).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    });
  });

  describe('edge cases', () => {
    it('should always return exactly 7 days', () => {
      const weekStarts = [0, 1, 2, 3, 4, 5, 6] as const;
      const formats = ['short', 'long', 'narrow'] as const;

      weekStarts.forEach((start) => {
        formats.forEach((format) => {
          const result = getWeekdays(start, 'en-US', format);
          expect(result).toHaveLength(7);
        });
      });
    });

    it('should return unique values (no duplicates)', () => {
      const result = getWeekdays(1, 'en-US', 'long');
      const uniqueDays = new Set(result);
      expect(uniqueDays.size).toBe(7);
    });

    it('should handle narrow format where some letters repeat (T for Tue/Thu, S for Sat/Sun)', () => {
      const result = getWeekdays(0, 'en-US', 'narrow');
      expect(result).toHaveLength(7);
      // In narrow format, T appears twice (Tuesday, Thursday) and S appears twice (Saturday, Sunday)
      expect(result).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
    });

    it('should maintain consistency across multiple calls with same parameters', () => {
      const result1 = getWeekdays(1, 'en-US', 'long');
      const result2 = getWeekdays(1, 'en-US', 'long');
      expect(result1).toEqual(result2);
    });

    it('should return different results for different start days', () => {
      const monday = getWeekdays(1);
      const sunday = getWeekdays(0);
      expect(monday).not.toEqual(sunday);
      expect(monday[0]).toBe('Mon');
      expect(sunday[0]).toBe('Sun');
    });
  });

  describe('backwards compatibility', () => {
    it('should maintain backwards compatibility with single argument', () => {
      const result = getWeekdays(0);
      expect(result[0]).toBe('Sun');
      expect(result[1]).toBe('Mon');
      expect(result).toHaveLength(7);
    });

    it('should maintain backwards compatibility with two arguments', () => {
      const result = getWeekdays(1, 'es-ES');
      expect(result).toHaveLength(7);
      expect(result[0]).toBe('lun');
    });

    it('should maintain backwards compatibility with all three arguments', () => {
      const result = getWeekdays(0, 'en-US', 'long');
      expect(result).toEqual([
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ]);
    });
  });
});
