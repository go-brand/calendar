import { Temporal } from '@js-temporal/polyfill';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, Suspense, startTransition, useEffect } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CalendarProvider, useCalendar, useCalendarView, useCreateCalendar } from './index';
import type { ContextCalendarController } from './index';

const july = Temporal.PlainDate.from('2026-07-10');
const august = Temporal.PlainDate.from('2026-08-10');
const observations: string[] = [];

function Controls() {
  const calendar = useCalendar();
  return (
    <>
      <output data-testid="controls">
        {calendar.date.toString()} {calendar.view}
      </output>
      <button onClick={() => calendar.next()}>Next</button>
      <button onClick={() => calendar.previous()}>Previous</button>
      <button onClick={() => calendar.setView('week')}>Week</button>
      <button onClick={() => startTransition(() => calendar.next())}>Transition</button>
    </>
  );
}

function Projection() {
  const calendar = useCalendar();
  const day = useCalendarView({ view: 'day' });
  const value = day.date.toString();
  const observed = `${value}:${calendar.view}`;
  observations.push(`render:${observed}`);
  useEffect(() => {
    observations.push(`effect:${observed}`);
  }, [observed]);
  return (
    <output data-testid="projection">
      {value} {day.timeSlots.length} {calendar.visibleRange.start.timeZoneId}
    </output>
  );
}

type OwnedProps = {
  date?: Temporal.PlainDate;
  view?: 'month' | 'week' | 'day';
  onDateChange?: (date: Temporal.PlainDate) => void;
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  timeZone?: string;
  dayEnd?: string;
};

function OwnedApp({ timeZone = 'UTC', dayEnd = '10:00', ...props }: OwnedProps) {
  const calendar = useCreateCalendar({
    views: {
      month: true,
      week: true,
      day: {
        dayStart: Temporal.PlainTime.from('08:00'),
        dayEnd: Temporal.PlainTime.from(dayEnd),
        slotDuration: Temporal.Duration.from({ hours: 1 }),
      },
    },
    defaultDate: july,
    defaultView: 'month',
    timeZone,
    ...props,
    // Exercise the alias before determining ownership too.
    items: [{ date: july }],
    getDate: (item) => item.date,
  });
  const direct = useCalendarView({ calendar, view: 'day' });
  return (
    <CalendarProvider calendar={calendar}>
      <Controls />
      <Projection />
      <output data-testid="direct">{direct.date.toString()}</output>
    </CalendarProvider>
  );
}

function expectDate(date: string, view = 'month') {
  expect(screen.getByTestId('controls').textContent).toBe(`${date} ${view}`);
  expect(screen.getByTestId('projection').textContent).toContain(date);
  expect(screen.getByTestId('direct').textContent).toBe(date);
}

describe('hook-owned composition characterization', () => {
  it('keeps controls and both projections current through repeated navigation', () => {
    render(<OwnedApp />);
    fireEvent.click(screen.getByText('Next'));
    expectDate('2026-08-10');
    fireEvent.click(screen.getByText('Next'));
    expectDate('2026-09-10');
    fireEvent.click(screen.getByText('Previous'));
    expectDate('2026-08-10');
    fireEvent.click(screen.getByText('Week'));
    expectDate('2026-08-10', 'week');
    fireEvent.click(screen.getByText('Next'));
    expectDate('2026-08-17', 'week');
  });

  it('reflects controlled props and replacement geometry immediately', () => {
    const { rerender } = render(<OwnedApp date={july} view="month" />);
    expectDate('2026-07-10');
    rerender(<OwnedApp date={august} view="day" timeZone="America/New_York" dayEnd="12:00" />);
    expectDate('2026-08-10', 'day');
    expect(screen.getByTestId('projection').textContent).toBe('2026-08-10 4 America/New_York');
  });

  it('never renders or runs projection effects for rejected controlled proposals', () => {
    const onDateChange = vi.fn();
    const onViewChange = vi.fn();
    render(
      <OwnedApp date={july} view="month" onDateChange={onDateChange} onViewChange={onViewChange} />,
    );
    observations.length = 0;
    fireEvent.click(screen.getByText('Next'));
    expectDate('2026-07-10');
    fireEvent.click(screen.getByText('Week'));
    expectDate('2026-07-10');
    expect(onDateChange).toHaveBeenCalledExactlyOnceWith(august);
    expect(onViewChange).toHaveBeenCalledExactlyOnceWith('week');
    expect(observations.length).toBeGreaterThan(0);
    expect(observations.every((value) => value.endsWith('2026-07-10:month'))).toBe(true);
  });

  it('waits for delayed acceptance of controlled date and view', () => {
    const onDateChange = vi.fn();
    const onViewChange = vi.fn();
    const { rerender } = render(
      <OwnedApp date={july} view="month" onDateChange={onDateChange} onViewChange={onViewChange} />,
    );
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Week'));
    expectDate('2026-07-10');
    rerender(
      <OwnedApp date={onDateChange.mock.calls[0][0]} view={onViewChange.mock.calls[0][0]} />,
    );
    expectDate('2026-08-10', 'week');
  });

  it('cleans up hook-owned subscriptions in StrictMode and on replacement/unmount', () => {
    const onDateChange = vi.fn();
    const calendars: ContextCalendarController[] = [];
    function App({ date }: { date: Temporal.PlainDate }) {
      const calendar = useCreateCalendar({
        views: { month: true },
        date,
        timeZone: 'UTC',
        onDateChange,
      });
      useEffect(() => {
        calendars.push(calendar);
      }, [calendar]);
      return (
        <CalendarProvider calendar={calendar}>
          <Controls />
        </CalendarProvider>
      );
    }
    const { rerender, unmount } = render(
      <StrictMode>
        <App date={july} />
      </StrictMode>,
    );
    const old = calendars.at(-1)!;
    fireEvent.click(screen.getByText('Next'));
    expect(onDateChange).toHaveBeenCalledTimes(1);
    rerender(
      <StrictMode>
        <App date={august} />
      </StrictMode>,
    );
    act(() => old.next());
    expect(onDateChange).toHaveBeenCalledTimes(1);
    const current = calendars.at(-1)!;
    unmount();
    act(() => current.next());
    expect(onDateChange).toHaveBeenCalledTimes(1);
  });

  it('keeps controls above suspended content usable during urgent navigation', () => {
    const pending = new Promise<never>(() => undefined);
    function Pending(): never {
      throw pending;
    }
    function App() {
      const calendar = useCreateCalendar({
        views: { month: true },
        defaultDate: july,
        timeZone: 'UTC',
      });
      return (
        <CalendarProvider calendar={calendar}>
          <Controls />
          <Suspense fallback={<span>Loading</span>}>
            <Pending />
          </Suspense>
        </CalendarProvider>
      );
    }
    render(<App />);
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByTestId('controls').textContent).toBe('2026-08-10 month');
    fireEvent.click(screen.getByText('Previous'));
    expect(screen.getByTestId('controls').textContent).toBe('2026-07-10 month');
    expect(screen.getByText('Loading')).not.toBeNull();
  });

  it('preserves revealed content during hook-owned transition navigation', async () => {
    let revealAugust = false;
    let resolve!: () => void;
    const pending = new Promise<void>((done) => {
      resolve = done;
    });
    function View() {
      const day = useCalendarView({ view: 'day' });
      if (day.date.equals(august) && !revealAugust) throw pending;
      return <span data-testid="revealed">{day.date.toString()}</span>;
    }
    function App() {
      const calendar = useCreateCalendar({
        views: { month: true, day: true },
        defaultDate: july,
        timeZone: 'UTC',
      });
      return (
        <CalendarProvider calendar={calendar}>
          <Controls />
          <Suspense fallback={<span>Loading</span>}>
            <View />
          </Suspense>
        </CalendarProvider>
      );
    }
    render(<App />);
    expect(screen.getByTestId('revealed').textContent).toBe('2026-07-10');
    fireEvent.click(screen.getByText('Transition'));
    expect(screen.queryByText('Loading')).toBeNull();
    expect(screen.getByTestId('revealed').textContent).toBe('2026-07-10');
    expect(screen.getByText('Next')).not.toBeNull();
    await act(async () => {
      revealAugust = true;
      resolve();
      await pending;
    });
    expect(screen.getByTestId('revealed').textContent).toBe('2026-08-10');
    expect(screen.getByTestId('controls').textContent).toBe('2026-08-10 month');
  });

  it('hydrates matching explicit inputs and then navigates', async () => {
    const onRecoverableError = vi.fn();
    function App() {
      const calendar = useCreateCalendar({
        views: { month: true, day: true },
        defaultDate: july,
        defaultView: 'month',
        timeZone: 'UTC',
      });
      return (
        <CalendarProvider calendar={calendar}>
          <Controls />
          <Projection />
        </CalendarProvider>
      );
    }
    const container = document.createElement('div');
    document.body.append(container);
    container.innerHTML = renderToString(<App />);
    let root!: ReturnType<typeof hydrateRoot>;
    try {
      await act(async () => {
        root = hydrateRoot(container, <App />, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByTestId('controls').textContent).toBe('2026-08-10 month');
      expect(screen.getByTestId('projection').textContent).toContain('2026-08-10');
    } finally {
      act(() => root?.unmount());
      container.remove();
    }
  });
});
