import { describe, it, expect, vi } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { createCalendar } from './calendar';
import type { CalendarAccessor } from '../types';

type TestEvent = {
  id: string;
  date: string;
  title: string;
  start?: string;
  end?: string;
};

const testAccessor: CalendarAccessor<TestEvent> = {
  getDate: (item) => Temporal.PlainDate.from(item.date),
  getStart: (item) => item.start ? Temporal.ZonedDateTime.from(item.start) : Temporal.Now.zonedDateTimeISO(),
  getEnd: (item) => item.end ? Temporal.ZonedDateTime.from(item.end) : Temporal.Now.zonedDateTimeISO(),
};

describe('createCalendar', () => {
  describe('initialization', () => {
    it('should create a calendar instance with month view only', () => {
      const calendar = createCalendar<TestEvent>({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
      });

      expect(calendar).toBeDefined();
      expect(calendar.getMonth).toBeDefined();
      expect(calendar.getWeek).toBeDefined();
      expect(calendar.getDay).toBeDefined();
      expect(calendar.getState).toBeDefined();
      expect(calendar.setState).toBeDefined();
    });

    it('should create a calendar with all views', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
          week: { accessor: testAccessor },
          day: { accessor: testAccessor },
        },
      });

      expect(calendar).toBeDefined();
      expect(calendar.getMonth).toBeDefined();
      expect(calendar.getWeek).toBeDefined();
      expect(calendar.getDay).toBeDefined();
    });

    it('should initialize with current date', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
      });

      const state = calendar.getState();
      const today = Temporal.Now.plainDateISO();

      expect(state.referenceDate.year).toBe(today.year);
      expect(state.referenceDate.month).toBe(today.month);
      expect(state.referenceDate.day).toBe(today.day);
    });

    it('should initialize with custom state', () => {
      const customDate = Temporal.PlainDate.from('2024-06-15');
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
        state: { referenceDate: customDate },
      });

      const state = calendar.getState();
      expect(state.referenceDate.toString()).toBe('2024-06-15');
    });
  });

  describe('month view', () => {
    it('should return month data', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      const month = calendar.getMonth();
      expect(month.month.year).toBe(2024);
      expect(month.month.month).toBe(1);
      expect(month.weeks.length).toBeGreaterThan(0);
    });

    it('should navigate to next month', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      calendar.nextMonth();
      const state = calendar.getState();

      expect(state.referenceDate.year).toBe(2024);
      expect(state.referenceDate.month).toBe(2);
      expect(state.referenceDate.day).toBe(1);
    });

    it('should navigate to previous month', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-02-15') },
      });

      calendar.previousMonth();
      const state = calendar.getState();

      expect(state.referenceDate.year).toBe(2024);
      expect(state.referenceDate.month).toBe(1);
      expect(state.referenceDate.day).toBe(1);
    });

    it('should use custom weekStartsOn for month view', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor, weekStartsOn: 0 }, // Sunday
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      const month = calendar.getMonth();
      const firstWeek = month.weeks[0];
      expect(firstWeek[0].date.dayOfWeek).toBe(7); // Sunday is 7 in Temporal
    });

    it('should format month title', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      const title = calendar.getTitle('month', 'en-US');
      expect(title).toContain('January');
      expect(title).toContain('2024');
    });
  });

  describe('week view', () => {
    it('should return week data', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          week: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      const week = calendar.getWeek();
      expect(week.days.length).toBe(7);
      expect(week.weekStart).toBeDefined();
      expect(week.weekEnd).toBeDefined();
    });

    it('should navigate to next week', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          week: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      calendar.nextWeek();
      const state = calendar.getState();

      expect(state.referenceDate.toString()).toBe('2024-01-22');
    });

    it('should navigate to previous week', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          week: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      calendar.previousWeek();
      const state = calendar.getState();

      expect(state.referenceDate.toString()).toBe('2024-01-08');
    });

    it('should format week title', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          week: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      const title = calendar.getTitle('week', 'en-US');
      expect(title).toContain('-');
      expect(title).toContain('2024');
    });
  });

  describe('day view', () => {
    it('should return day data', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          day: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      const day = calendar.getDay();
      expect(day.date.toString()).toBe('2024-01-15');
      expect(day.isToday).toBeDefined();
      expect(day.items).toBeDefined();
    });

    it('should navigate to next day', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          day: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      calendar.nextDay();
      const state = calendar.getState();

      expect(state.referenceDate.toString()).toBe('2024-01-16');
    });

    it('should navigate to previous day', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          day: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      calendar.previousDay();
      const state = calendar.getState();

      expect(state.referenceDate.toString()).toBe('2024-01-14');
    });

    it('should format day title', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          day: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      const title = calendar.getTitle('day', 'en-US');
      expect(title).toContain('Monday');
      expect(title).toContain('January');
      expect(title).toContain('15');
      expect(title).toContain('2024');
    });
  });

  describe('shared navigation', () => {
    it('should navigate to today', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2020-01-01') },
      });

      calendar.goToToday();
      const state = calendar.getState();
      const today = Temporal.Now.plainDateISO();

      expect(state.referenceDate.toString()).toBe(today.toString());
    });

    it('should navigate to specific date', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          week: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-01') },
      });

      const targetDate = Temporal.PlainDate.from('2024-06-15');
      calendar.goToDate(targetDate);
      const state = calendar.getState();

      expect(state.referenceDate.toString()).toBe('2024-06-15');
    });

    it('should navigate to specific month', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      calendar.goToMonth(2024, 6);
      const state = calendar.getState();

      expect(state.referenceDate.year).toBe(2024);
      expect(state.referenceDate.month).toBe(6);
      expect(state.referenceDate.day).toBe(1);
    });
  });

  describe('view-aware navigation shortcuts', () => {
    it('should navigate next based on view', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
          week: { accessor: testAccessor },
          day: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      calendar.next('month');
      expect(calendar.getState().referenceDate.month).toBe(2);

      calendar.setState(() => ({ referenceDate: Temporal.PlainDate.from('2024-01-15') }));
      calendar.next('week');
      expect(calendar.getState().referenceDate.day).toBe(22);

      calendar.setState(() => ({ referenceDate: Temporal.PlainDate.from('2024-01-15') }));
      calendar.next('day');
      expect(calendar.getState().referenceDate.day).toBe(16);
    });

    it('should navigate previous based on view', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
          week: { accessor: testAccessor },
          day: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-02-15') },
      });

      calendar.previous('month');
      expect(calendar.getState().referenceDate.month).toBe(1);

      calendar.setState(() => ({ referenceDate: Temporal.PlainDate.from('2024-01-15') }));
      calendar.previous('week');
      expect(calendar.getState().referenceDate.day).toBe(8);

      calendar.setState(() => ({ referenceDate: Temporal.PlainDate.from('2024-01-15') }));
      calendar.previous('day');
      expect(calendar.getState().referenceDate.day).toBe(14);
    });

    it('should navigate next using currentView when view is omitted', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
          week: { accessor: testAccessor },
          day: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      // Default view is 'month' (first configured view)
      calendar.next();
      expect(calendar.getState().referenceDate.month).toBe(2);

      // Switch to week view and navigate
      calendar.setState(() => ({ referenceDate: Temporal.PlainDate.from('2024-01-15'), currentView: 'week' }));
      calendar.next();
      expect(calendar.getState().referenceDate.day).toBe(22);

      // Switch to day view and navigate
      calendar.setState(() => ({ referenceDate: Temporal.PlainDate.from('2024-01-15'), currentView: 'day' }));
      calendar.next();
      expect(calendar.getState().referenceDate.day).toBe(16);
    });

    it('should navigate previous using currentView when view is omitted', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
          week: { accessor: testAccessor },
          day: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-02-15') },
      });

      // Default view is 'month' (first configured view)
      calendar.previous();
      expect(calendar.getState().referenceDate.month).toBe(1);

      // Switch to week view and navigate
      calendar.setState(() => ({ referenceDate: Temporal.PlainDate.from('2024-01-15'), currentView: 'week' }));
      calendar.previous();
      expect(calendar.getState().referenceDate.day).toBe(8);

      // Switch to day view and navigate
      calendar.setState(() => ({ referenceDate: Temporal.PlainDate.from('2024-01-15'), currentView: 'day' }));
      calendar.previous();
      expect(calendar.getState().referenceDate.day).toBe(14);
    });
  });

  describe('state synchronization', () => {
    it('should maintain single state across all views', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
          week: { accessor: testAccessor },
          day: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      calendar.nextMonth();

      const monthView = calendar.getMonth();
      const weekView = calendar.getWeek();
      const dayView = calendar.getDay();
      const state = calendar.getState();

      expect(monthView.month.month).toBe(2);
      expect(weekView.days.some(d => d.date.month === 2)).toBe(true);
      expect(dayView.date.month).toBe(2);
      expect(state.referenceDate.month).toBe(2);
    });

    it('should call onStateChange callback', () => {
      const onStateChange = vi.fn();
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
        onStateChange,
      });

      calendar.nextMonth();

      expect(onStateChange).toHaveBeenCalled();
    });

    it('should call onStateChange with computed dateRange', () => {
      const onStateChange = vi.fn();
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
        timeZone: 'Europe/Madrid',
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
        onStateChange,
      });

      calendar.nextMonth();

      expect(onStateChange).toHaveBeenCalledTimes(1);
      const newState = onStateChange.mock.calls[0][0];

      // The callback should receive the state object directly
      expect(typeof newState).toBe('object');
      expect(newState).toHaveProperty('referenceDate');
      expect(newState).toHaveProperty('dateRange');

      // dateRange should be defined and have the correct structure
      expect(newState.dateRange).toBeDefined();
      expect(newState.dateRange.start).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(newState.dateRange.end).toBeInstanceOf(Temporal.ZonedDateTime);

      // The dateRange should reflect the new month (February 2024)
      expect(newState.referenceDate.month).toBe(2);
      expect(newState.dateRange.start.month).toBe(1); // Month view includes days from previous month
      expect(newState.dateRange.end.month).toBe(3); // Month view includes days from next month
    });

    it('should update state with setState', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      calendar.setState((old) => ({
        referenceDate: Temporal.PlainDate.from('2024-06-15'),
      }));

      const state = calendar.getState();
      expect(state.referenceDate.toString()).toBe('2024-06-15');
    });
  });

  describe('data handling', () => {
    it('should include events in month view', () => {
      const testData: TestEvent[] = [
        { id: '1', date: '2024-01-15', title: 'Event 1' },
        { id: '2', date: '2024-01-16', title: 'Event 2' },
      ];

      const calendar = createCalendar({
        data: testData,
        views: {
          month: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      const month = calendar.getMonth();
      const allItems = month.weeks.flatMap(week =>
        week.flatMap(day => day.items)
      );

      expect(allItems.length).toBe(2);
    });

    it('should update data with setOptions', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      calendar.setOptions((old) => ({
        ...old,
        data: [{ id: '1', date: '2024-01-15', title: 'New Event' }],
      }));

      const month = calendar.getMonth();
      const allItems = month.weeks.flatMap(week =>
        week.flatMap(day => day.items)
      );

      expect(allItems.length).toBe(1);
      expect(allItems[0].title).toBe('New Event');
    });
  });

  describe('different accessors per view', () => {
    it('should use different accessors for different views', () => {
      const monthAccessor: CalendarAccessor<TestEvent> = {
        getDate: (item) => Temporal.PlainDate.from(item.date),
      };

      const weekAccessor: CalendarAccessor<TestEvent> = {
        getDate: (item) => Temporal.PlainDate.from(item.date),
        getStart: (item) => item.start ? Temporal.ZonedDateTime.from(item.start) : undefined,
      };

      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: monthAccessor },
          week: { accessor: weekAccessor },
        },
        state: { referenceDate: Temporal.PlainDate.from('2024-01-15') },
      });

      const month = calendar.getMonth();
      const week = calendar.getWeek();

      expect(month).toBeDefined();
      expect(week).toBeDefined();
    });
  });

  describe('store property', () => {
    it('should expose TanStack store', () => {
      const calendar = createCalendar({
        data: [],
        views: {
          month: { accessor: testAccessor },
        },
      });

      expect(calendar.store).toBeDefined();
      expect(calendar.store.state).toBeDefined();
    });
  });
});
