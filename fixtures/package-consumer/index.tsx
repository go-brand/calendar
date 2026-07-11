import { Temporal } from '@js-temporal/polyfill';
import {
  CalendarProvider,
  buildMonthView,
  buildWeekView,
  createCalendar,
  useCalendar,
  useCalendarView,
  useCreateCalendar,
} from '@gobrand/react-calendar';

const date = Temporal.PlainDate.from('2026-07-10');
const posts = [{ id: 'post', date }];

function SimpleCalendar() {
  const calendar = useCreateCalendar({
    views: { month: true, week: true },
    defaultDate: date,
    items: posts,
    getDate: (post) => post.date,
  });

  calendar.setView('week');
  // @ts-expect-error day was not configured
  calendar.setView('day');

  if (calendar.activeView.view === 'month') {
    calendar.activeView.weeks.flatMap((week) => week.flatMap((day) => day.items[0]?.id));
  }

  return <CalendarProvider calendar={calendar}>{calendar.title('en-US')}</CalendarProvider>;
}

function ContextConsumer() {
  const calendar = useCalendar();
  // @ts-expect-error context is item-agnostic and accepts no generic argument
  useCalendar<{ forged: true }>();
  const month = useCalendarView({
    view: 'month',
    items: [{ label: 'summary', date }],
    getDate: (summary) => summary.date,
  });
  const week = useCalendarView({
    view: 'week',
    items: [
      {
        count: 1,
        startsAt: Temporal.ZonedDateTime.from('2026-07-10T09:00:00Z[UTC]'),
      },
    ],
    getDate: (event) => event.startsAt.toPlainDate(),
    getStart: (event) => event.startsAt,
  });

  return <>{calendar.view}{month.weeks.length}{week.days.length}</>;
}

const controller = createCalendar({ views: { month: true, week: true }, date });
buildMonthView({
  calendar: controller,
  items: [{ label: 'summary', date }],
  getDate: (summary) => summary.date,
});
buildWeekView({
  calendar: controller,
  items: [{ count: 1, startsAt: Temporal.ZonedDateTime.from('2026-07-10T09:00:00Z[UTC]') }],
  getDate: (event) => event.startsAt.toPlainDate(),
  getStart: (event) => event.startsAt,
});

const shorthandController = createCalendar({ views: { month: true, week: true }, date });
shorthandController.setView('week');
// @ts-expect-error day was not configured
shorthandController.setView('day');

// @ts-expect-error false is not a supported view value
createCalendar({ views: { month: false }, date });

// @ts-expect-error a calendar requires at least one configured view
createCalendar({ views: {} });

// @ts-expect-error items require getDate
useCreateCalendar({ views: { month: true }, items: posts });

void SimpleCalendar;
void ContextConsumer;
