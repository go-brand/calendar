'use client';

import { useCreateCalendar } from '@gobrand/react-calendar';
import {
  Calendar,
  CalendarCell,
  CalendarEvent,
  CalendarGrid,
  CalendarRow,
  CalendarToolbar,
  CalendarWeekdays,
} from './calendar-ui';
import { accessor, events } from './mock-data';

export function BasicMonthExample() {
  const calendar = useCreateCalendar({
    views: { month: true },
    items: events,
    getDate: accessor.getDate,
    getStart: accessor.getStart,
  });
  const month = calendar.activeView;

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
    </Calendar>
  );
}
