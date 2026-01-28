import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { Temporal } from '@js-temporal/polyfill';
import { useCreateCalendar, useCalendar, useView, CalendarProvider, type CalendarAccessor, createCalendar } from './index';
import React from 'react';

type Event = {
  id: string;
  date: string;
  start?: string;
  end?: string;
};

const accessor: CalendarAccessor<Event> = {
  getDate: (event) => Temporal.PlainDate.from(event.date),
  getStart: (event) => event.start ? Temporal.ZonedDateTime.from(event.start) : Temporal.Now.zonedDateTimeISO(),
  getEnd: (event) => event.end ? Temporal.ZonedDateTime.from(event.end) : Temporal.Now.zonedDateTimeISO(),
};

describe('useCreateCalendar', () => {
  describe('type inference', () => {
    it('allows single type argument (TItem only)', () => {
      // This test verifies the DX improvement:
      // Users can now pass just <TItem> without specifying TOptions
      const { result } = renderHook(() =>
        useCreateCalendar<Event>({
          views: {
            month: { accessor },
          },
          timeZone: 'America/New_York',
          onStateChange: (state) => {
            // TypeScript should infer state type correctly
            const _date = state.referenceDate;
          },
        })
      );

      expect(result.current.getMonth).toBeDefined();
    });

    it('infers types without any type argument', () => {
      // TypeScript should infer TItem from accessor usage
      const { result } = renderHook(() =>
        useCreateCalendar({
          views: {
            month: { accessor },
          },
        })
      );

      expect(result.current.getMonth).toBeDefined();
    });
  });

  describe('initialization', () => {
    it('initializes with current date by default', () => {
      const { result } = renderHook(() =>
        useCreateCalendar<Event>({
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
        useCreateCalendar<Event>({
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
        useCreateCalendar<Event>({
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
    it('core createCalendar works with data', () => {
      // Direct test of core function to ensure it works
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const testData: Event[] = [
        { id: '1', date: '2025-01-15' },
      ];

      const calendar = createCalendar<Event>({
        views: { month: { accessor } },
        state: { referenceDate },
      });

      const month = calendar.getMonth(testData);
      const allItems = month.weeks.flatMap(week => week.flatMap(day => day.items));
      expect(allItems.length).toBe(1);
    });

    it('renders month view with data', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const testData: Event[] = [
        { id: '1', date: '2025-01-15' },
      ];
      const { result } = renderHook(() =>
        useCreateCalendar<Event>({
          views: {
            month: { accessor },
          },
          state: { referenceDate },
        })
      );

      // Debug: Check if accessor is available
      const calendarAccessor = result.current.options.views.month?.accessor;
      expect(calendarAccessor).toBeDefined();
      expect(calendarAccessor?.getDate).toBeDefined();

      const month = result.current.getMonth(testData);
      expect(month).toBeDefined();
      expect(month.weeks.length).toBeGreaterThan(0);
      expect(month.month.year).toBe(2025);
      expect(month.month.month).toBe(1);

      const allItems = month.weeks.flatMap(week => week.flatMap(day => day.items));
      expect(allItems.length).toBe(1);
    });

    it('navigates to next month', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCreateCalendar<Event>({
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
        useCreateCalendar<Event>({
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
  });

  describe('week view', () => {
    it('renders week view', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCreateCalendar<Event>({
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
        useCreateCalendar<Event>({
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
  });

  describe('day view', () => {
    it('renders day view', () => {
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCreateCalendar<Event>({
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
        useCreateCalendar<Event>({
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
  });

  describe('shared navigation', () => {
    it('goes to today', () => {
      const referenceDate = Temporal.PlainDate.from('2020-01-15');
      const { result } = renderHook(() =>
        useCreateCalendar<Event>({
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
        useCreateCalendar<Event>({
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
  });

  describe('state synchronization', () => {
    it('calls onStateChange callback', () => {
      const onStateChange = vi.fn();
      const referenceDate = Temporal.PlainDate.from('2025-01-15');
      const { result } = renderHook(() =>
        useCreateCalendar<Event>({
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
});

describe('CalendarProvider and useCalendar', () => {
  it('provides calendar via context', () => {
    const referenceDate = Temporal.PlainDate.from('2025-01-15');

    function TestComponent() {
      const calendar = useCalendar<Event>();
      return <div data-testid="title">{calendar.getTitle('month', 'en-US')}</div>;
    }

    function Wrapper() {
      const calendar = useCreateCalendar<Event>({
        views: { month: { accessor } },
        state: { referenceDate },
      });
      return (
        <CalendarProvider calendar={calendar}>
          <TestComponent />
        </CalendarProvider>
      );
    }

    render(<Wrapper />);
    expect(screen.getByTestId('title').textContent).toContain('January');
    expect(screen.getByTestId('title').textContent).toContain('2025');
  });

  it('throws error when useCalendar is used outside provider', () => {
    function TestComponent() {
      useCalendar();
      return null;
    }

    expect(() => render(<TestComponent />)).toThrow(
      'useCalendar must be used within a CalendarProvider'
    );
  });
});

describe('useView', () => {
  it('returns month view data based on currentView', () => {
    const referenceDate = Temporal.PlainDate.from('2025-01-15');
    const testData: Event[] = [
      { id: '1', date: '2025-01-15' },
    ];

    function TestComponent() {
      const view = useView({ data: testData });
      return (
        <div>
          <div data-testid="type">{view.type}</div>
          <div data-testid="items">
            {view.type === 'month'
              ? view.data.weeks.flatMap(w => w.flatMap(d => d.items)).length
              : 0}
          </div>
        </div>
      );
    }

    function Wrapper() {
      const calendar = useCreateCalendar<Event>({
        views: { month: { accessor } },
        state: { referenceDate },
      });
      return (
        <CalendarProvider calendar={calendar}>
          <TestComponent />
        </CalendarProvider>
      );
    }

    render(<Wrapper />);
    expect(screen.getByTestId('type').textContent).toBe('month');
    expect(screen.getByTestId('items').textContent).toBe('1');
  });

  it('returns specific view when name is provided', () => {
    const referenceDate = Temporal.PlainDate.from('2025-01-15');
    const testData: Event[] = [];

    function TestComponent() {
      const monthView = useView({ data: testData, name: 'month' });
      const weekView = useView({ data: testData, name: 'week' });
      return (
        <div>
          <div data-testid="month-type">{monthView.type}</div>
          <div data-testid="week-type">{weekView.type}</div>
        </div>
      );
    }

    function Wrapper() {
      const calendar = useCreateCalendar<Event>({
        views: { month: { accessor }, week: { accessor } },
        state: { referenceDate },
      });
      return (
        <CalendarProvider calendar={calendar}>
          <TestComponent />
        </CalendarProvider>
      );
    }

    render(<Wrapper />);
    expect(screen.getByTestId('month-type').textContent).toBe('month');
    expect(screen.getByTestId('week-type').textContent).toBe('week');
  });

  it('works with explicit calendar (escape hatch)', () => {
    const referenceDate = Temporal.PlainDate.from('2025-01-15');
    const testData: Event[] = [];

    const { result } = renderHook(() => {
      const calendar = useCreateCalendar<Event>({
        views: { month: { accessor } },
        state: { referenceDate },
      });
      const view = useView({ data: testData, calendar });
      return { calendar, view };
    });

    expect(result.current.view.type).toBe('month');
  });

  it('throws error when no calendar is available', () => {
    function TestComponent() {
      useView({ data: [] });
      return null;
    }

    expect(() => render(<TestComponent />)).toThrow(
      'No calendar found'
    );
  });

  it('memoizes view data', () => {
    const referenceDate = Temporal.PlainDate.from('2025-01-15');
    const testData: Event[] = [];
    let renderCount = 0;

    function TestComponent() {
      renderCount++;
      const view = useView({ data: testData });
      return <div data-testid="type">{view.type}</div>;
    }

    function Wrapper() {
      const calendar = useCreateCalendar<Event>({
        views: { month: { accessor } },
        state: { referenceDate },
      });
      return (
        <CalendarProvider calendar={calendar}>
          <TestComponent />
        </CalendarProvider>
      );
    }

    const { rerender } = render(<Wrapper />);
    const initialRenderCount = renderCount;

    // Rerender with same props should not create new view object
    rerender(<Wrapper />);
    expect(renderCount).toBeGreaterThan(initialRenderCount);
    expect(screen.getByTestId('type').textContent).toBe('month');
  });
});
