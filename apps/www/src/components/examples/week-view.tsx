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
  CalendarCell,
  CalendarEvent,
  CalendarGrid,
  CalendarRow,
  CalendarTimeCell,
  CalendarTimeGrid,
  CalendarTimeGridRow,
  CalendarToolbar,
  CalendarWeekHeader,
  CalendarWeekdays,
} from './calendar-ui';
import { accessor, fetchEvents } from './mock-data';

export function SimpleWeekExample() {
  const calendar = useCreateCalendar({ views: { week: true } });
  return (
    <CalendarProvider calendar={calendar}>
      <SimpleWeekCalendar />
    </CalendarProvider>
  );
}

function SimpleWeekCalendar() {
  const calendar = useCalendar();
  return (
    <Calendar size="month">
      <CalendarToolbar
        title={calendar.title()}
        previousLabel="Previous week"
        nextLabel="Next week"
        onPrevious={calendar.previous}
        onNext={calendar.next}
      />
      <CalendarWeekdays start={calendar.visibleRange.start.toPlainDate()} />
      <Suspense fallback={<div>Loading…</div>}>
        <SimpleWeekContent />
      </Suspense>
    </Calendar>
  );
}

function SimpleWeekContent() {
  const calendar = useCalendar();
  const { start, end } = calendar.visibleRange;
  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });
  const week = useCalendarView({
    view: 'week',
    items: events,
    getDate: accessor.getDate,
    getStart: accessor.getStart,
  });

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

export function WeekSlotsExample() {
  const calendar = useCreateCalendar({
    views: {
      week: {
        dayStart: Temporal.PlainTime.from('00:00'),
        dayEnd: Temporal.PlainTime.from('23:59:59.999999999'),
        slotDuration: Temporal.Duration.from({ hours: 1 }),
      },
    },
  });
  return (
    <CalendarProvider calendar={calendar}>
      <WeekSlotsCalendar />
    </CalendarProvider>
  );
}

function WeekSlotsCalendar() {
  const calendar = useCalendar();
  return (
    <Calendar size="wide">
      <CalendarToolbar
        title={calendar.title()}
        previousLabel="Previous week"
        nextLabel="Next week"
        onPrevious={calendar.previous}
        onNext={calendar.next}
      />
      <Suspense fallback={<div>Loading…</div>}>
        <WeekContentWithSlots />
      </Suspense>
    </Calendar>
  );
}

function WeekContentWithSlots() {
  const calendar = useCalendar();
  const { start, end } = calendar.visibleRange;
  const { data: events } = useSuspenseQuery({
    queryKey: ['events-slots', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });
  const week = useCalendarView({
    view: 'week',
    items: events,
    getDate: accessor.getDate,
    getStart: accessor.getStart,
  });
  const timeSlots = week.days[0]?.timeSlots ?? [];

  return (
    <CalendarTimeGrid header={<CalendarWeekHeader days={week.days} />}>
      {timeSlots.map((slot, slotIndex) => (
        <CalendarTimeGridRow
          key={slot.id}
          label={slot.time.toLocaleString('en', { hour: 'numeric' })}
        >
          {week.days.map((day) => {
            const daySlot = day.timeSlots?.[slotIndex];
            return (
              <CalendarTimeCell key={day.id}>
                {daySlot?.items.map((event) => (
                  <CalendarEvent key={event.id}>{event.title}</CalendarEvent>
                ))}
              </CalendarTimeCell>
            );
          })}
        </CalendarTimeGridRow>
      ))}
    </CalendarTimeGrid>
  );
}
