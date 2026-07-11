import { Temporal } from '@js-temporal/polyfill';
import { Suspense } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {
  CalendarProvider,
  useCalendar,
  useCalendarView,
  useCreateCalendar,
} from '@gobrand/react-calendar';
import type { MonthView as MonthViewModel } from '@gobrand/react-calendar';

type Event = {
  id: string;
  date: Temporal.PlainDate;
  startsAt: Temporal.ZonedDateTime;
};

export function SimpleCalendar({ events }: { events: Event[] }) {
  const calendar = useCreateCalendar({
    views: { month: true, week: true },
    items: events,
    getDate: (event) => event.date,
    getStart: (event) => event.startsAt,
  });

  if (calendar.activeView.view !== 'month') return null;
  return calendar.activeView.weeks.flat().map((day) => (
    <div key={day.id}>{day.items.length}</div>
  ));
}

type Summary = { id: string; date: string };
const queryClient = new QueryClient();

function monthQuery(range: {
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
}) {
  return queryOptions({
    queryKey: ['calendar', 'month', range.start.toString(), range.end.toString()],
    queryFn: async (): Promise<{ summaries: Summary[] }> => {
      const params = new URLSearchParams({
        start: range.start.toInstant().toString(),
        end: range.end.toInstant().toString(),
      });
      const response = await fetch(`/api/summaries?${params}`);
      if (!response.ok) throw new Error('Failed to load calendar summaries');
      return response.json();
    },
  });
}

function CalendarControls() {
  const calendar = useCalendar();
  return <button onClick={calendar.next}>{calendar.title()}</button>;
}

function CalendarSkeleton() {
  return <div>Loading</div>;
}

function MonthGrid({ month }: { month: MonthViewModel<Summary> }) {
  return <div>{month.weeks.length}</div>;
}

export function SuspenseCalendar() {
  const calendar = useCreateCalendar({ views: { month: true, week: true } });
  return (
    <QueryClientProvider client={queryClient}>
      <CalendarProvider calendar={calendar}>
        <CalendarControls />
        <Suspense fallback={<CalendarSkeleton />}>
          <MonthContent />
        </Suspense>
      </CalendarProvider>
    </QueryClientProvider>
  );
}

function MonthContent() {
  const calendar = useCalendar();
  const { data } = useSuspenseQuery(monthQuery(calendar.visibleRange));
  const month = useCalendarView({
    view: 'month',
    items: data.summaries,
    getDate: (summary) => Temporal.PlainDate.from(summary.date),
  });
  return <MonthGrid month={month} />;
}
