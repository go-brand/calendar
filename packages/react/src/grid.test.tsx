import { Temporal } from '@js-temporal/polyfill';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  buildMonthView,
  CalendarProvider,
  useCalendarGrid,
  useCalendarView,
  useCreateCalendar,
} from './index';

function MonthGridHarness({
  initialDate = Temporal.PlainDate.from('2026-07-15'),
  onSelectDate,
}: {
  initialDate?: Temporal.PlainDate;
  onSelectDate?: (date: Temporal.PlainDate) => void;
}) {
  const calendar = useCreateCalendar({
    views: { month: true },
    defaultDate: initialDate,
    timeZone: 'UTC',
    weekStartsOn: 1,
  });
  const month = useCalendarView({ view: 'month', calendar });
  const { focusedDate, getGridProps, getDayCellProps } = useCalendarGrid({
    calendar,
    selectedDate: initialDate,
    onSelectDate,
  });

  return (
    <div>
      <div data-testid="title">{calendar.title('en-US')}</div>
      <div data-testid="focused">{focusedDate.toString()}</div>
      <div {...getGridProps()}>
        {month.weeks.map((week, rowIndex) => (
          <div key={rowIndex} role="row">
            {week.map((day) => (
              <button key={day.id} type="button" {...getDayCellProps(day.date)}>
                {day.date.day}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

describe('useCalendarGrid', () => {
  it('sets WAI-ARIA grid attributes and roving tabIndex', () => {
    render(<MonthGridHarness />);
    const grid = screen.getByRole('grid', { name: 'July 2026' });
    expect(grid).toBeTruthy();

    const activeCell = grid.querySelector('[data-date="2026-07-15"]') as HTMLElement;
    const otherCell = grid.querySelector('[data-date="2026-07-16"]') as HTMLElement;
    expect(activeCell.getAttribute('role')).toBe('gridcell');
    expect(activeCell.getAttribute('tabindex')).toBe('0');
    expect(activeCell.getAttribute('aria-selected')).toBe('true');
    expect(otherCell.getAttribute('tabindex')).toBe('-1');
    expect(otherCell.getAttribute('aria-selected')).toBe('false');
  });

  it('navigates days, weeks, row boundaries, and months with keyboard', () => {
    const onSelectDate = vi.fn();
    render(<MonthGridHarness onSelectDate={onSelectDate} />);
    const grid = screen.getByRole('grid');

    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(screen.getByTestId('focused').textContent).toBe('2026-07-16');

    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    expect(screen.getByTestId('focused').textContent).toBe('2026-07-23');

    fireEvent.keyDown(grid, { key: 'Home' });
    expect(screen.getByTestId('focused').textContent).toBe('2026-07-20');

    fireEvent.keyDown(grid, { key: 'End' });
    expect(screen.getByTestId('focused').textContent).toBe('2026-07-26');

    fireEvent.keyDown(grid, { key: 'PageDown' });
    expect(screen.getByTestId('focused').textContent).toBe('2026-08-26');
    expect(screen.getByTestId('title').textContent).toBe('August 2026');

    fireEvent.keyDown(grid, { key: 'PageUp', shiftKey: true });
    expect(screen.getByTestId('focused').textContent).toBe('2025-08-26');
    expect(screen.getByTestId('title').textContent).toBe('August 2025');

    fireEvent.keyDown(grid, { key: 'Enter' });
    expect(onSelectDate).toHaveBeenCalledWith(Temporal.PlainDate.from('2025-08-26'));
  });

  it('works with CalendarProvider without passing calendar explicitly', () => {
    function InnerGrid() {
      const { getGridProps } = useCalendarGrid();
      return <div {...getGridProps()} />;
    }

    function ProviderHarness() {
      const calendar = useCreateCalendar({
        views: { month: true },
        defaultDate: Temporal.PlainDate.from('2026-07-15'),
        timeZone: 'UTC',
      });
      return (
        <CalendarProvider calendar={calendar}>
          <InnerGrid />
        </CalendarProvider>
      );
    }

    render(<ProviderHarness />);
    expect(screen.getByRole('grid')).toBeTruthy();
  });

  it('allows item-bearing useCreateCalendar result to be passed directly to buildMonthView', () => {
    function InteropHarness() {
      const calendar = useCreateCalendar({
        views: { month: true },
        defaultDate: Temporal.PlainDate.from('2026-07-15'),
        timeZone: 'UTC',
        items: [{ id: '1', date: Temporal.PlainDate.from('2026-07-15') }],
        getDate: (item) => item.date,
      });
      const month = buildMonthView({ calendar });
      return <div data-testid="weeks">{month.weeks.length}</div>;
    }

    render(<InteropHarness />);
    expect(Number(screen.getByTestId('weeks').textContent)).toBeGreaterThanOrEqual(4);
  });
});
