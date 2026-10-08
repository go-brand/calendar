import { Temporal } from '@js-temporal/polyfill';
import { createCalendar, buildMonthView } from '@gobrand/calendar-core';
import { createCalendar as createReactCalendar, useCreateCalendar } from '@gobrand/react-calendar';

const calendar = createCalendar({
  views: { month: true, week: true },
  date: Temporal.PlainDate.from('2026-07-10'),
});
calendar.setView('week');
// @ts-expect-error day is not configured
calendar.setView('day');
const projection = buildMonthView({ calendar });
const reactCalendar = createReactCalendar({
  views: { month: true },
  date: Temporal.PlainDate.from('2026-07-10'),
});
// @ts-expect-error false is not a supported view value
createCalendar({ views: { month: false } });
void projection;
void reactCalendar;
function ReactConsumer() {
  const calendar = useCreateCalendar({ views: { month: true } });
  calendar.setView('month');
  // @ts-expect-error week is not configured
  calendar.setView('week');
  return calendar;
}
void ReactConsumer;
