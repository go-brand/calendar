'use client';

import { Temporal } from '@js-temporal/polyfill';
import { useCreateCalendar } from '@gobrand/react-calendar';
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
import { accessor, events } from './mock-data';

export function SimpleWeekExample() {
  const calendar = useCreateCalendar({
    views: { week: true },
    items: events,
    getDate: accessor.getDate,
  });
  const week = calendar.activeView;

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
    </Calendar>
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
    items: events,
    getDate: accessor.getDate,
    getStart: accessor.getStart,
  });
  const week = calendar.activeView;
  const timeSlots = week.days[0]?.timeSlots ?? [];

  return (
    <Calendar size="wide">
      <CalendarToolbar
        title={calendar.title()}
        previousLabel="Previous week"
        nextLabel="Next week"
        onPrevious={calendar.previous}
        onNext={calendar.next}
      />
      <CalendarTimeGrid header={<CalendarWeekHeader days={week.days} />}>
        {timeSlots.map((slot, slotIndex) => (
          <CalendarTimeGridRow
            key={slot.id}
            label={slot.time.toLocaleString('en', { hour: 'numeric' })}
          >
            {week.days.map((day) => {
              const daySlot = day.timeSlots[slotIndex];
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
    </Calendar>
  );
}
