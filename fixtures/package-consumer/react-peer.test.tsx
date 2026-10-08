import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Temporal } from '@js-temporal/polyfill';
import { useCreateCalendar } from '@gobrand/react-calendar';

afterEach(cleanup);

function Calendar() {
  const calendar = useCreateCalendar({
    views: { month: true },
    defaultDate: Temporal.PlainDate.from('2026-07-10'),
  });
  return (
    <>
      <output>{calendar.date.toString()}</output>
      <button onClick={() => calendar.next()}>Next</button>
      <button onClick={() => calendar.previous()}>Previous</button>
    </>
  );
}

test('matched React peer mounts and navigates through two updates', () => {
  render(<Calendar />);
  expect(screen.getByRole('status').textContent).toBe('2026-07-10');
  fireEvent.click(screen.getByText('Next'));
  expect(screen.getByRole('status').textContent).toBe('2026-08-10');
  fireEvent.click(screen.getByText('Previous'));
  expect(screen.getByRole('status').textContent).toBe('2026-07-10');
});
