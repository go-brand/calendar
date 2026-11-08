import { Temporal } from '@js-temporal/polyfill';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  CalendarProvider,
  createCalendar,
  useCalendar,
  useCalendarView,
  useCreateCalendar,
} from './index';
import type { ContextCalendarController } from './index';

const july = Temporal.PlainDate.from('2026-07-10');
const august = Temporal.PlainDate.from('2026-08-10');
function external(date = july) {
  return createCalendar({
    views: { month: true, week: true, day: true },
    date,
    view: 'month',
    timeZone: 'UTC',
  });
}

function Controls() {
  const calendar = useCalendar();
  return (
    <>
      <output>
        {calendar.date.toString()} {calendar.view}
      </output>
      <button onClick={() => calendar.next()}>Next</button>
    </>
  );
}

function View({ calendar }: { calendar?: ContextCalendarController }) {
  const day = useCalendarView({
    calendar,
    view: 'day',
    items: [{ id: 'august', date: august }],
    getDate: (item) => item.date,
  });
  return (
    <output>
      {day.name} {day.date.toString()} {day.items.map((item) => item.id).join(',')}
    </output>
  );
}

function trackSubscriptions(calendar: ContextCalendarController) {
  let active = 0;
  const subscribe = calendar.subscribe.bind(calendar);
  const spy = vi.spyOn(calendar, 'subscribe').mockImplementation((listener) => {
    active++;
    const unsubscribe = subscribe(listener);
    return () => {
      active--;
      unsubscribe();
    };
  });
  return { spy, active: () => active };
}

describe('external controller subscriptions', () => {
  it('updates useCalendar controls through provider navigation and view changes', () => {
    const calendar = external();
    render(
      <CalendarProvider calendar={calendar}>
        <Controls />
      </CalendarProvider>,
    );
    act(() => calendar.setDate(august));
    expect(screen.getByRole('status').textContent).toBe('2026-08-10 month');
    act(() => calendar.next());
    expect(screen.getByRole('status').textContent).toBe('2026-09-10 month');
    act(() => calendar.previous());
    expect(screen.getByRole('status').textContent).toBe('2026-08-10 month');
    act(() => calendar.setView('week'));
    expect(screen.getByRole('status').textContent).toBe('2026-08-10 week');
  });

  it.each(['explicit', 'provider'] as const)(
    'updates a %s projection independently of controls',
    (input) => {
      const calendar = external();
      render(
        input === 'explicit' ? (
          <View calendar={calendar} />
        ) : (
          <CalendarProvider calendar={calendar}>
            <View />
          </CalendarProvider>
        ),
      );
      act(() => calendar.setDate(august));
      expect(screen.getByRole('status').textContent).toBe('day 2026-08-10 august');
      act(() => calendar.next());
      expect(screen.getByRole('status').textContent).toBe('day 2026-09-10 ');
      act(() => calendar.previous());
      expect(screen.getByRole('status').textContent).toBe('day 2026-08-10 august');
      act(() => calendar.setView('week'));
      expect(screen.getByRole('status').textContent).toBe('day 2026-08-10 august');
      act(() => calendar.next());
      expect(screen.getByRole('status').textContent).toBe('day 2026-08-17 ');
    },
  );

  it.each(['controls', 'explicit', 'provider'] as const)(
    'cleans up %s subscriptions in StrictMode, replacement, and unmount',
    (input) => {
      const first = external();
      const second = external(august);
      const firstTracking = trackSubscriptions(first);
      const secondTracking = trackSubscriptions(second);
      function App({ calendar }: { calendar: ContextCalendarController }) {
        return (
          <>
            {input === 'explicit' ? (
              <View calendar={calendar} />
            ) : (
              <CalendarProvider calendar={calendar}>
                {input === 'controls' ? <Controls /> : <View />}
              </CalendarProvider>
            )}
          </>
        );
      }
      const { rerender, unmount } = render(
        <StrictMode>
          <App calendar={first} />
        </StrictMode>,
      );
      expect(firstTracking.active()).toBe(1);
      expect(firstTracking.spy.mock.calls.length).toBeGreaterThan(1);
      rerender(
        <StrictMode>
          <App calendar={second} />
        </StrictMode>,
      );
      expect(firstTracking.active()).toBe(0);
      expect(secondTracking.active()).toBe(1);
      act(() => first.next());
      expect(screen.getByRole('status').textContent).toContain('2026-08-10');
      act(() => second.next());
      expect(screen.getByRole('status').textContent).toContain('2026-09-10');
      unmount();
      expect(secondTracking.active()).toBe(0);
    },
  );

  it('switches between external and hook-owned aliases without changing consumer hook order', () => {
    const calendar = external(august);
    const tracking = trackSubscriptions(calendar);
    const rejected = vi.fn();
    function App({ useExternal }: { useExternal: boolean }) {
      const owned = useCreateCalendar({
        views: { month: true, day: true },
        date: july,
        view: 'month',
        timeZone: 'UTC',
        onDateChange: rejected,
        items: [{ date: july }],
        getDate: (item) => item.date,
      });
      const selected = useExternal ? calendar : owned;
      return (
        <CalendarProvider calendar={selected}>
          <Controls />
          <View />
          <View calendar={selected} />
        </CalendarProvider>
      );
    }
    const { rerender, unmount } = render(<App useExternal />);
    expect(tracking.active()).toBe(3);
    fireEvent.click(screen.getByText('Next'));
    expect(
      screen.getAllByRole('status').every((node) => node.textContent?.includes('2026-09-10')),
    ).toBe(true);
    rerender(<App useExternal={false} />);
    expect(tracking.active()).toBe(0);
    fireEvent.click(screen.getByText('Next'));
    expect(rejected).toHaveBeenCalledExactlyOnceWith(august);
    expect(
      screen.getAllByRole('status').every((node) => node.textContent?.includes('2026-07-10')),
    ).toBe(true);
    rerender(<App useExternal />);
    expect(tracking.active()).toBe(3);
    fireEvent.click(screen.getByText('Next'));
    expect(
      screen.getAllByRole('status').every((node) => node.textContent?.includes('2026-10-10')),
    ).toBe(true);
    unmount();
    expect(tracking.active()).toBe(0);
  });

  it('hydrates an external controller with matching server snapshot inputs and navigates', async () => {
    const server = external();
    const client = external();
    const onRecoverableError = vi.fn();
    function App({ calendar }: { calendar: ContextCalendarController }) {
      return (
        <CalendarProvider calendar={calendar}>
          <Controls />
          <View />
          <View calendar={calendar} />
        </CalendarProvider>
      );
    }
    const container = document.createElement('div');
    document.body.append(container);
    container.innerHTML = renderToString(<App calendar={server} />);
    let root!: ReturnType<typeof hydrateRoot>;
    try {
      await act(async () => {
        root = hydrateRoot(container, <App calendar={client} />, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      fireEvent.click(screen.getByText('Next'));
      expect(
        screen.getAllByRole('status').every((node) => node.textContent?.includes('2026-08-10')),
      ).toBe(true);
    } finally {
      act(() => root?.unmount());
      container.remove();
    }
  });

  it('preserves the descriptive missing-controller error for projections', () => {
    expect(() => renderHook(() => useCalendarView({ view: 'day' }))).toThrow(
      'useCalendarView must be used within CalendarProvider or receive a calendar',
    );
  });
});
