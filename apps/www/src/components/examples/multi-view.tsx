'use client';

import { Suspense } from 'react';
import {
  CalendarProvider,
  type DayView as DayViewModel,
  type MonthView as MonthViewModel,
  type WeekView as WeekViewModel,
  useCalendar,
  useCalendarView,
  useCreateCalendar,
} from '@gobrand/react-calendar';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarEvent,
  CalendarGrid,
  CalendarRow,
  CalendarToolbar,
  CalendarWeekdays,
} from './calendar-ui';
import { accessor, type Event, fetchEvents } from './mock-data';

export function MultiViewExample() {
  const calendar = useCreateCalendar({
    views: { month: true, week: true, day: true },
  });
  return (
    <CalendarProvider calendar={calendar}>
      <MultiViewCalendar />
    </CalendarProvider>
  );
}

function MultiViewCalendar() {
  const calendar = useCalendar();
  return (
    <Calendar size="month">
      <CalendarToolbar
        title={calendar.title()}
        previousLabel="Previous date range"
        nextLabel="Next date range"
        onPrevious={calendar.previous}
        onNext={calendar.next}
      >
        {(Object.keys(calendar.views) as (keyof typeof calendar.views)[]).map((view) => (
          <Button key={view} active={calendar.view === view} onClick={() => calendar.setView(view)}>
            {view[0].toUpperCase() + view.slice(1)}
          </Button>
        ))}
      </CalendarToolbar>
      {calendar.view !== 'day' && (
        <CalendarWeekdays start={calendar.visibleRange.start.toPlainDate()} />
      )}
      <Suspense fallback={<div>Loading…</div>}>
        <ViewContent />
      </Suspense>
    </Calendar>
  );
}

function ViewContent() {
  const calendar = useCalendar();
  const { start, end } = calendar.visibleRange;
  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });
  const view = useCalendarView({
    view: calendar.view,
    items: events,
    getDate: accessor.getDate,
    getStart: accessor.getStart,
  });

  switch (view.view) {
    case 'month':
      return <MonthView month={view} />;
    case 'week':
      return <WeekView week={view} />;
    case 'day':
      return <DayView day={view} />;
  }
}

function MonthView({ month }: { month: MonthViewModel<Event> }) {
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

function WeekView({ week }: { week: WeekViewModel<Event> }) {
  return (
    <CalendarGrid>
      <CalendarRow>
        {week.days.map((day) => (
          <CalendarCell key={day.id} date={day.date} today={day.isToday}>
            {day.items.map((event) => (
              <CalendarEvent key={event.id}>{event.title}</CalendarEvent>
            ))}
          </CalendarCell>
        ))}
      </CalendarRow>
    </CalendarGrid>
  );
}

function DayView({ day }: { day: DayViewModel<Event> }) {
  return (
    <CalendarGrid>
      <CalendarCell date={day.date} today={day.isToday}>
        {day.items.length > 0
          ? day.items.map((event) => <CalendarEvent key={event.id}>{event.title}</CalendarEvent>)
          : 'No events'}
      </CalendarCell>
    </CalendarGrid>
  );
}
