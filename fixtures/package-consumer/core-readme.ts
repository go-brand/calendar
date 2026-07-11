import { Temporal } from '@js-temporal/polyfill';
import { buildMonthView, createCalendar } from '@gobrand/calendar-core';

type Event = {
  id: string;
  title: string;
  date: Temporal.PlainDate;
};

const events: Event[] = [{ id: 'launch', title: 'Launch', date: Temporal.Now.plainDateISO() }];

const calendar = createCalendar({
  views: { month: true },
});

const month = buildMonthView({
  calendar,
  items: events,
  getDate: (event) => event.date,
});

for (const day of month.weeks.flat()) {
  console.log(
    day.date.toString(),
    day.items.map((event) => event.title),
  );
}
