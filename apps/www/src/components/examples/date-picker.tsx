'use client';

import { useCalendarView, useCreateCalendar } from '@gobrand/react-calendar';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarRow,
  CalendarToolbar,
  CalendarWeekdays,
} from './calendar-ui';

export function DatePickerExample() {
  const calendar = useCreateCalendar({ views: { month: true } });
  const month = useCalendarView({ calendar, view: 'month' });

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
                <Button
                  active={day.date.equals(calendar.date)}
                  aria-label={`Select ${day.date.toString()}`}
                  onClick={() => calendar.setDate(day.date)}
                >
                  Select
                </Button>
              </CalendarCell>
            ))}
          </CalendarRow>
        ))}
      </CalendarGrid>
    </Calendar>
  );
}
