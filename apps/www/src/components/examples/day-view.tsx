'use client';

import { Temporal } from '@js-temporal/polyfill';
import { useCreateCalendar } from '@gobrand/react-calendar';
import {
  Calendar,
  CalendarEvent,
  CalendarTimeline,
  CalendarTimeRow,
  CalendarToolbar,
} from './calendar-ui';
import { accessor, events } from './mock-data';

export function DayViewExample() {
  const calendar = useCreateCalendar({
    views: {
      day: {
        dayStart: Temporal.PlainTime.from('00:00'),
        dayEnd: Temporal.PlainTime.from('23:59:59.999999999'),
        slotDuration: Temporal.Duration.from({ hours: 1 }),
      },
    },
    items: events,
    getDate: accessor.getDate,
    getStart: accessor.getStart,
  });
  const day = calendar.activeView;

  return (
    <Calendar size="day">
      <CalendarToolbar
        title={calendar.title()}
        previousLabel="Previous day"
        nextLabel="Next day"
        onPrevious={calendar.previous}
        onNext={calendar.next}
      />
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
    </Calendar>
  );
}
