import { Temporal } from '@js-temporal/polyfill';
import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CalendarProvider, useCalendar, useCalendarView, useCreateCalendar } from './index';

const july = Temporal.PlainDate.from('2026-07-10');
const august = Temporal.PlainDate.from('2026-08-10');

describe('calendar v1 React API', () => {
  it('accepts true view shorthand and exposes normalized configs', () => {
    const { result } = renderHook(() =>
      useCreateCalendar({
        views: { month: true, week: true },
        defaultDate: july,
      }),
    );

    expect(result.current.views).toEqual({ month: {}, week: {} });
    expect(result.current.viewNames).toEqual(['month', 'week']);
  });

  it('infers simple-mode items and updates activeView after navigation', () => {
    const { result } = renderHook(() =>
      useCreateCalendar({
        views: { month: true, week: true },
        defaultDate: july,
        defaultView: 'month',
        items: [{ id: 'post', date: july }],
        getDate: (item) => item.date,
      }),
    );

    expect(result.current.activeView.name).toBe('month');
    expect(result.current.activeView.view).toBe(result.current.activeView.name);
    expect(
      result.current.activeView.name === 'month'
        ? result.current.activeView.weeks.flatMap((week) => week.flatMap((day) => day.items))
        : [],
    ).toHaveLength(1);

    act(() => result.current.next());
    expect(result.current.date.toString()).toBe('2026-08-10');
    expect(result.current.activeView.name).toBe('month');
  });

  it('reflects controlled date, view, timezone, and geometry on rerender', () => {
    const onDateChange = vi.fn();
    const onViewChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ date, view, timeZone, dayEnd }) =>
        useCreateCalendar({
          views: {
            week: {
              dayStart: Temporal.PlainTime.from('08:00'),
              dayEnd,
              slotDuration: Temporal.Duration.from({ minutes: 30 }),
            },
            month: true,
          },
          date,
          view,
          timeZone,
          onDateChange,
          onViewChange,
          items: [] as { date: Temporal.PlainDate }[],
          getDate: (item) => item.date,
        }),
      {
        initialProps: {
          date: july,
          view: 'week' as 'month' | 'week',
          timeZone: 'UTC',
          dayEnd: Temporal.PlainTime.from('10:00'),
        },
      },
    );

    expect(result.current.activeView.name).toBe('week');
    expect(
      result.current.activeView.name === 'week' && result.current.activeView.days[0].timeSlots,
    ).toHaveLength(4);

    rerender({
      date: august,
      view: 'month',
      timeZone: 'America/New_York',
      dayEnd: Temporal.PlainTime.from('11:00'),
    });

    expect(result.current.date.equals(august)).toBe(true);
    expect(result.current.view).toBe('month');
    expect(result.current.visibleRange.start.timeZoneId).toBe('America/New_York');

    act(() => result.current.previous());
    expect(onDateChange).toHaveBeenCalledWith(Temporal.PlainDate.from('2026-07-10'));
  });

  it('projects independent item types below one provider', () => {
    const calendar = renderHook(() =>
      useCreateCalendar({ views: { month: true, week: true }, defaultDate: july }),
    ).result.current;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CalendarProvider calendar={calendar}>{children}</CalendarProvider>
    );

    const month = renderHook(
      () =>
        useCalendarView({
          view: 'month',
          items: [{ label: 'summary', date: july }],
          getDate: (item) => item.date,
        }),
      { wrapper },
    ).result.current;
    const week = renderHook(
      () =>
        useCalendarView({
          view: 'week',
          items: [
            {
              count: 1,
              startsAt: Temporal.ZonedDateTime.from('2026-07-10T09:00:00Z[UTC]'),
            },
          ],
          getDate: (item) => item.startsAt.toPlainDate(),
          getStart: (item) => item.startsAt,
        }),
      { wrapper },
    ).result.current;

    expect(month.name).toBe('month');
    expect(week.name).toBe('week');
  });

  it('keeps controls mounted while a child view suspends', () => {
    const pending = new Promise<never>(() => undefined);

    function Controls() {
      const calendar = useCalendar();
      return <button onClick={calendar.next}>Next</button>;
    }

    function PendingView(): never {
      throw pending;
    }

    function App() {
      const calendar = useCreateCalendar({ views: { month: true }, defaultDate: july });
      return (
        <CalendarProvider calendar={calendar}>
          <Controls />
          <Suspense fallback={<div>Loading view</div>}>
            <PendingView />
          </Suspense>
        </CalendarProvider>
      );
    }

    render(<App />);
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeNull();
    expect(screen.getByText('Loading view')).not.toBeNull();
  });

  it('throws when context is missing', () => {
    expect(() => renderHook(() => useCalendar())).toThrow(
      'useCalendar must be used within CalendarProvider',
    );
  });
});
