'use client';

import { Suspense } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import {
  CalendarProvider,
  useCalendar,
  useCalendarView,
  useCreateCalendar,
} from '@gobrand/react-calendar';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  Calendar,
  CalendarEvent,
  CalendarTimeline,
  CalendarTimeRow,
  CalendarToolbar,
} from './calendar-ui';
import { accessor, fetchEvents } from './mock-data';

export function DayViewExample() {
  const calendar = useCreateCalendar({
    views: {
      day: {
        dayStart: Temporal.PlainTime.from('00:00'),
        dayEnd: Temporal.PlainTime.from('23:59:59.999999999'),
        slotDuration: Temporal.Duration.from({ hours: 1 }),
      },
    },
  });
  return (
    <CalendarProvider calendar={calendar}>
      <DayCalendar />
    </CalendarProvider>
  );
}

function DayCalendar() {
  const calendar = useCalendar();
  return (
    <Calendar size="day">
      <CalendarToolbar
        title={calendar.title()}
        previousLabel="Previous day"
        nextLabel="Next day"
        onPrevious={calendar.previous}
        onNext={calendar.next}
      />
      <Suspense fallback={<div>Loading…</div>}>
        <DayContent />
      </Suspense>
    </Calendar>
  );
}

function DayContent() {
  const calendar = useCalendar();
  const { start, end } = calendar.visibleRange;
  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });
  const day = useCalendarView({
    view: 'day',
    items: events,
    getDate: accessor.getDate,
    getStart: accessor.getStart,
  });

  return (
    <CalendarTimeline>
      {day.timeSlots.map((slot) => (
        <CalendarTimeRow
          key={slot.id}
          label={slot.time.toLocaleString('en-US', { timeStyle: 'short' })}
        >
          {slot.items.map((event) => (
            <CalendarEvent key={event.id}>{event.title}</CalendarEvent>
          ))}
        </CalendarTimeRow>
      ))}
    </CalendarTimeline>
  );
}
