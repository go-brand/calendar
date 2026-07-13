'use client';

import {
  type DayView,
  type MonthView,
  type WeekView,
  useCreateCalendar,
} from '@gobrand/react-calendar';
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
import { accessor, events, type Event } from './mock-data';

export function MultiViewExample() {
  const calendar = useCreateCalendar({
    views: { month: true, week: true, day: true },
    items: events,
    getDate: accessor.getDate,
  });
  const view = calendar.activeView;

  return (
    <Calendar size="month">
      <CalendarToolbar
        title={calendar.title()}
        previousLabel="Previous date range"
        nextLabel="Next date range"
        onPrevious={calendar.previous}
        onNext={calendar.next}
      >
        {calendar.viewNames.map((name) => (
          <Button key={name} active={calendar.view === name} onClick={() => calendar.setView(name)}>
            {name[0].toUpperCase() + name.slice(1)}
          </Button>
        ))}
      </CalendarToolbar>
      {calendar.view !== 'day' && (
        <CalendarWeekdays start={calendar.visibleRange.start.toPlainDate()} />
      )}
      {view.name === 'month' && <MonthCalendar month={view} />}
      {view.name === 'week' && <WeekCalendar week={view} />}
      {view.name === 'day' && <DayCalendar day={view} />}
    </Calendar>
  );
}

function MonthCalendar({ month }: { month: MonthView<Event> }) {
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

function WeekCalendar({ week }: { week: WeekView<Event> }) {
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

function DayCalendar({ day }: { day: DayView<Event> }) {
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
