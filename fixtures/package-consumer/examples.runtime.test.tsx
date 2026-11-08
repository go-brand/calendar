import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Temporal } from '@js-temporal/polyfill';
import { BasicMonthExample } from './examples/basic-month';
import { events } from './examples/mock-data';
import { DatePickerExample } from './examples/date-picker';
import { MultiViewExample } from './examples/multi-view';
import { SimpleWeekExample, WeekSlotsExample } from './examples/week-view';
import { DayViewExample } from './examples/day-view';
import { StandaloneSuspenseMonth } from './examples/suspense-standalone';
import { meeting, getDate, getStart } from './timezone-recipe';

afterEach(cleanup);

for (const [name, Example] of [
  ['basic month', BasicMonthExample],
  ['date picker', DatePickerExample],
  ['multi view', MultiViewExample],
  ['simple week', SimpleWeekExample],
  ['week slots', WeekSlotsExample],
  ['day view', DayViewExample],
] as const) {
  test(`${name} renders and navigates using installed packages`, () => {
    render(<Example />);
    const title = screen.getByRole('heading').textContent;
    fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
    expect(screen.getByRole('heading').textContent).not.toBe(title);
    fireEvent.click(screen.getByRole('button', { name: /^Previous/ }));
    expect(screen.getByRole('heading').textContent).toBe(title);
  });
}

test('date selection updates the active day', () => {
  render(<DatePickerExample />);
  const buttons = screen.getAllByRole('button', { name: /^Select / });
  const target = buttons.find((button) => button.getAttribute('aria-pressed') === 'false')!;
  const label = target.getAttribute('aria-label')!;
  fireEvent.click(target);
  expect(screen.getByRole('button', { name: label }).getAttribute('aria-pressed')).toBe('true');
  expect(
    screen
      .getAllByRole('button', { name: /^Select / })
      .filter((button) => button.getAttribute('aria-pressed') === 'true'),
  ).toHaveLength(1);
});

test('multi-view controls change the configured view', () => {
  render(<MultiViewExample />);
  for (const name of ['Week', 'Day', 'Month']) {
    fireEvent.click(screen.getByRole('button', { name, exact: true }));
    expect(screen.getByRole('button', { name, exact: true }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  }
});

test('standalone Suspense has a QueryClient provider and resolves events with usable controls', async () => {
  render(<StandaloneSuspenseMonth />);
  expect(screen.getByText('Loading events…')).toBeTruthy();
  const title = screen.getByRole('heading').textContent;
  fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
  expect(screen.getByRole('heading').textContent).not.toBe(title);
  await waitFor(() => expect(screen.queryByText('Loading events…')).toBeNull());
  expect(
    screen.getAllByText(events.find((event) => event.id === '1-3')!.title).length,
  ).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
  await waitFor(() => expect(screen.queryByText('Loading events…')).toBeNull());
  expect(screen.getByRole('heading').textContent).toBe(title);
});

test('the exact documented timezone recipe crosses UTC midnight consistently', () => {
  expect(getDate(meeting).toString()).toBe('2026-07-11');
  expect(getStart(meeting).hour).toBe(1);
  expect(getStart(meeting).toPlainDate().equals(getDate(meeting))).toBe(true);
  expect(
    getStart(meeting).toInstant().equals(Temporal.Instant.from('2026-07-10T23:30:00Z')),
  ).toBe(true);
});
