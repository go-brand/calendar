'use client';

import { Suspense } from 'react';
import {
  CalendarProvider,
  useCalendar,
  useCalendarView,
  useCreateCalendar,
} from '@gobrand/react-calendar';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  Calendar,
  CalendarCell,
  CalendarEvent,
  CalendarGrid,
  CalendarRow,
  CalendarToolbar,
  CalendarWeekdays,
} from './calendar-ui';
import { accessor, fetchEvents } from './mock-data';

export function SuspenseMonthExample() {
  const calendar = useCreateCalendar({ views: { month: true } });

  return (
    <CalendarProvider calendar={calendar}>
      <MonthCalendar />
    </CalendarProvider>
  );
}

function MonthCalendar() {
  const calendar = useCalendar();

  return (
    <Calendar size="month">
      <CalendarToolbar
        title={calendar.title()}
        previousLabel="Previous month"
        nextLabel="Next month"
        onPrevious={calendar.previous}
        onNext={calendar.next}
      />
      <CalendarWeekdays start={calendar.visibleRange.start.toPlainDate()} />
      <Suspense fallback={<div>Loading events…</div>}>
        <MonthContent />
      </Suspense>
    </Calendar>
  );
}

function MonthContent() {
  const calendar = useCalendar();
  const { start, end } = calendar.visibleRange;
  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });
  const month = useCalendarView({
    view: 'month',
    items: events,
    getDate: accessor.getDate,
  });

  return (
    <CalendarGrid>
      {month.weeks.map((week) => (
        <CalendarRow key={week[0].id}>
          {week.map((day) => (
            <CalendarCell
              key={day.id}
              date={day.date}
              current={day.isCurrentMonth}
              today={day.isToday}
            >
              {day.items.map((event) => (
                <CalendarEvent key={event.id}>{event.title}</CalendarEvent>
              ))}
            </CalendarCell>
          ))}
        </CalendarRow>
      ))}
    </CalendarGrid>
  );
}
