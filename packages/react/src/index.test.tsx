import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Temporal } from '@js-temporal/polyfill';
import { useCalendar } from './index';

type Event = {
  id: string;
  date: string;
  start?: string;
  end?: string;
};

const accessor = {
  getDate: (event: Event) => Temporal.PlainDate.from(event.date),
  getStart: (event: Event) => event.start ? Temporal.ZonedDateTime.from(event.start) : undefined,
  getEnd: (event: Event) => event.end ? Temporal.ZonedDateTime.from(event.end) : undefined,
};

describe('useCalendar', () => {
  describe('initialization', () => {
    it('initializes with current date by default', () => {
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
          },
        })
      );

      const state = result.current.getState();
      const now = Temporal.Now.plainDateISO();
      expect(state.referenceDate.year).toBe(now.year);
      expect(state.referenceDate.month).toBe(now.month);
    });

    it('initializes with provided date', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
          },
          state: { referenceDate },
        })
      );

      const state = result.current.getState();
      expect(state.referenceDate.toString()).toBe('2025-01-15');
    });

    it('creates calendar with all views', () => {
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
            week: { accessor },
            day: { accessor },
          },
        })
      );

      expect(result.current.getMonth).toBeDefined();
      expect(result.current.getWeek).toBeDefined();
      expect(result.current.getDay).toBeDefined();
    });
  });

  describe('month view', () => {
    it('renders month view', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
          },
          state: { referenceDate },
        })
      );

      const month = result.current.getMonth();
      expect(month).toBeDefined();
      expect(month.weeks.length).toBeGreaterThan(0);
      expect(month.month.year).toBe(2025);
      expect(month.month.month).toBe(1);
    });

    it('navigates to next month', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
          },
          state: { referenceDate },
        })
      );

      act(() => {
        result.current.nextMonth();
      });

      const state = result.current.getState();
      expect(state.referenceDate.month).toBe(2);
      expect(state.referenceDate.year).toBe(2025);
    });

    it('navigates to previous month', () => {
      const referenceDate = Temporal.PlainDate.from('2025-02-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
          },
          state: { referenceDate },
        })
      );

      act(() => {
        result.current.previousMonth();
      });

      const state = result.current.getState();
      expect(state.referenceDate.month).toBe(1);
      expect(state.referenceDate.year).toBe(2025);
    });

    it('formats month title', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
          },
          state: { referenceDate },
        })
      );

      const title = result.current.getTitle('month', 'en-US');
      expect(title).toContain('January');
      expect(title).toContain('2025');
    });
  });

  describe('week view', () => {
    it('renders week view', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            week: { accessor },
          },
          state: { referenceDate },
        })
      );

      const week = result.current.getWeek();
      expect(week).toBeDefined();
      expect(week.days.length).toBe(7);
    });

    it('navigates to next week', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            week: { accessor },
          },
          state: { referenceDate },
        })
      );

      act(() => {
        result.current.nextWeek();
      });

      const state = result.current.getState();
      expect(state.referenceDate.toString()).toBe('2025-01-22');
    });

    it('navigates to previous week', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            week: { accessor },
          },
          state: { referenceDate },
        })
      );

      act(() => {
        result.current.previousWeek();
      });

      const state = result.current.getState();
      expect(state.referenceDate.toString()).toBe('2025-01-08');
    });

    it('formats week title', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            week: { accessor },
          },
          state: { referenceDate },
        })
      );

      const title = result.current.getTitle('week', 'en-US');
      expect(title).toContain('-');
      expect(title).toContain('2025');
    });
  });

  describe('day view', () => {
    it('renders day view', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            day: { accessor },
          },
          state: { referenceDate },
        })
      );

      const day = result.current.getDay();
      expect(day).toBeDefined();
      expect(day.date.toString()).toBe('2025-01-15');
    });

    it('navigates to next day', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            day: { accessor },
          },
          state: { referenceDate },
        })
      );

      act(() => {
        result.current.nextDay();
      });

      const state = result.current.getState();
      expect(state.referenceDate.toString()).toBe('2025-01-16');
    });

    it('navigates to previous day', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            day: { accessor },
          },
          state: { referenceDate },
        })
      );

      act(() => {
        result.current.previousDay();
      });

      const state = result.current.getState();
      expect(state.referenceDate.toString()).toBe('2025-01-14');
    });

    it('formats day title', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            day: { accessor },
          },
          state: { referenceDate },
        })
      );

      const title = result.current.getTitle('day', 'en-US');
      expect(title).toContain('Wednesday');
      expect(title).toContain('January');
      expect(title).toContain('15');
      expect(title).toContain('2025');
    });
  });

  describe('shared navigation', () => {
    it('goes to today', () => {
      const referenceDate = Temporal.PlainDate.from('2020-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
          },
          state: { referenceDate },
        })
      );

      act(() => {
        result.current.goToToday();
      });

      const state = result.current.getState();
      const now = Temporal.Now.plainDateISO();
      expect(state.referenceDate.toString()).toBe(now.toString());
    });

    it('goes to specific date', () => {
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            week: { accessor },
          },
        })
      );

      act(() => {
        result.current.goToDate(Temporal.PlainDate.from('2025-06-15'));
      });

      const state = result.current.getState();
      expect(state.referenceDate.toString()).toBe('2025-06-15');
    });

    it('goes to specific month', () => {
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
          },
        })
      );

      act(() => {
        result.current.goToMonth(2025, 6);
      });

      const state = result.current.getState();
      expect(state.referenceDate.year).toBe(2025);
      expect(state.referenceDate.month).toBe(6);
      expect(state.referenceDate.day).toBe(1);
    });
  });

  describe('view-aware navigation', () => {
    it('navigates next based on view', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
            week: { accessor },
            day: { accessor },
          },
          state: { referenceDate },
        })
      );

      act(() => {
        result.current.next('month');
      });
      expect(result.current.getState().referenceDate.month).toBe(2);

      act(() => {
        result.current.goToDate(referenceDate);
        result.current.next('week');
      });
      expect(result.current.getState().referenceDate.day).toBe(22);

      act(() => {
        result.current.goToDate(referenceDate);
        result.current.next('day');
      });
      expect(result.current.getState().referenceDate.day).toBe(16);
    });

    it('navigates previous based on view', () => {
      const referenceDate = Temporal.PlainDate.from('2025-02-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
            week: { accessor },
            day: { accessor },
          },
          state: { referenceDate },
        })
      );

      act(() => {
        result.current.previous('month');
      });
      expect(result.current.getState().referenceDate.month).toBe(1);

      act(() => {
        result.current.goToDate(referenceDate);
        result.current.previous('week');
      });
      expect(result.current.getState().referenceDate.day).toBe(8);

      act(() => {
        result.current.goToDate(referenceDate);
        result.current.previous('day');
      });
      expect(result.current.getState().referenceDate.day).toBe(14);
    });
  });

  describe('state synchronization', () => {
    it('maintains single state across all views', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
            week: { accessor },
            day: { accessor },
          },
          state: { referenceDate },
        })
      );

      act(() => {
        result.current.nextMonth();
      });

      const monthView = result.current.getMonth();
      const weekView = result.current.getWeek();
      const dayView = result.current.getDay();
      const state = result.current.getState();

      expect(monthView.month.month).toBe(2);
      expect(weekView.days.some(d => d.date.month === 2)).toBe(true);
      expect(dayView.date.month).toBe(2);
      expect(state.referenceDate.month).toBe(2);
    });

    it('calls onStateChange callback', () => {
      const onStateChange = vi.fn();
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor },
          },
          state: { referenceDate },
          onStateChange,
        })
      );

      act(() => {
        result.current.nextMonth();
      });

      expect(onStateChange).toHaveBeenCalled();
    });
  });

  describe('data handling', () => {
    it('includes events in views', () => {
      const testData: Event[] = [
        { id: '1', date: '2025-01-15' },
        { id: '2', date: '2025-01-16' },
      ];

      const { result } = renderHook(() =>
        useCalendar({
          data: testData,
          views: {
            month: { accessor },
          },
          state: { referenceDate: Temporal.PlainDate.from('2025-01-15') },
        })
      );

      const month = result.current.getMonth();
      const allItems = month.weeks.flatMap(week =>
        week.flatMap(day => day.items)
      );

      expect(allItems.length).toBe(2);
    });

    it('updates data reactively', () => {
      const { result, rerender } = renderHook(
        ({ data }) =>
          useCalendar({
            data,
            views: {
              month: { accessor },
            },
            state: { referenceDate: Temporal.PlainDate.from('2025-01-15') },
          }),
        {
          initialProps: { data: [] as Event[] },
        }
      );

      let month = result.current.getMonth();
      let allItems = month.weeks.flatMap(week =>
        week.flatMap(day => day.items)
      );
      expect(allItems.length).toBe(0);

      rerender({
        data: [
          { id: '1', date: '2025-01-15' },
          { id: '2', date: '2025-01-16' },
        ],
      });

      month = result.current.getMonth();
      allItems = month.weeks.flatMap(week => week.flatMap(day => day.items));
      expect(allItems.length).toBe(2);
    });
  });

  describe('different accessors per view', () => {
    it('uses different accessors for different views', () => {
      const monthAccessor = {
        getDate: (event: Event) => Temporal.PlainDate.from(event.date),
      };

      const weekAccessor = {
        getDate: (event: Event) => Temporal.PlainDate.from(event.date),
        getStart: (event: Event) => event.start ? Temporal.ZonedDateTime.from(event.start) : undefined,
      };

      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor: monthAccessor },
            week: { accessor: weekAccessor },
          },
          state: { referenceDate: Temporal.PlainDate.from('2025-01-15') },
        })
      );

      const month = result.current.getMonth();
      const week = result.current.getWeek();

      expect(month).toBeDefined();
      expect(week).toBeDefined();
    });
  });

  describe('custom view options', () => {
    it('uses custom weekStartsOn for month view', () => {
      const { result } = renderHook(() =>
        useCalendar({
          data: [],
          views: {
            month: { accessor, weekStartsOn: 0 }, // Sunday
          },
          state: { referenceDate: Temporal.PlainDate.from('2025-01-15') },
        })
      );

      const month = result.current.getMonth();
      const firstWeek = month.weeks[0];
      expect(firstWeek[0].date.dayOfWeek).toBe(7); // Sunday is 7 in Temporal
    });

    it('uses time slots for week view', () => {
      const testData: Event[] = [
        {
          id: '1',
          date: '2025-01-15',
          start: '2025-01-15T10:00:00[UTC]',
        },
      ];

      const { result } = renderHook(() =>
        useCalendar({
          data: testData,
          views: {
            week: {
              accessor,
              startHour: 9,
              endHour: 17,
              slotDuration: 60,
            },
          },
          state: { referenceDate: Temporal.PlainDate.from('2025-01-15') },
        })
      );

      const week = result.current.getWeek();
      const wednesday = week.days[2]; // 2025-01-15 is Wednesday
      expect(wednesday.timeSlots).toBeDefined();
      expect(wednesday.timeSlots!.length).toBeGreaterThan(0);
    });
  });
});
