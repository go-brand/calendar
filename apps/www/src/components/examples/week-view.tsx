'use client';

import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useCreateCalendar, useCalendar, useView, CalendarProvider, getWeekdays } from '@gobrand/react-calendar';
import { Preview } from '@/components/preview';
import { type Event, fetchEvents, accessor } from './mock-data';

// =============================================================================
// Simple Week View (without time slots)
// =============================================================================

function SimpleWeekCalendar() {
  const calendar = useCreateCalendar<Event>({
    views: { week: { accessor, weekStartsOn: 1 } },
  });

  return (
    <CalendarProvider calendar={calendar}>
      <div className="w-full max-w-2xl">
        <Toolbar />
        <WeekdayHeaders />
        <Suspense fallback={<Loading />}>
          <SimpleWeekContent />
        </Suspense>
      </div>
    </CalendarProvider>
  );
}

function SimpleWeekContent() {
  const calendar = useCalendar<Event>();
  const { start, end } = calendar.dateRange;

  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });

  const { data: week } = useView({ data: events });

  return (
    <div className="grid grid-cols-7 gap-1">
      {week.days.map((day) => (
        <div key={day.date.toString()} className="min-h-[100px] p-1 rounded border bg-fd-card">
          <div className="text-center mb-2">
            <span className={`text-lg ${day.isToday ? 'bg-fd-primary text-fd-primary-foreground rounded-full w-8 h-8 inline-flex items-center justify-center' : ''}`}>
              {day.date.day}
            </span>
          </div>
          <div className="space-y-1">
            {day.items.map((event) => (
              <div key={event.id} className="text-xs bg-fd-primary text-fd-primary-foreground rounded px-1 py-0.5 truncate">
                {event.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Week View with Time Slots
// =============================================================================

function WeekCalendarWithSlots() {
  const calendar = useCreateCalendar<Event>({
    views: { week: { accessor, weekStartsOn: 1, startHour: 0, endHour: 24, slotDuration: 60 } },
  });

  return (
    <CalendarProvider calendar={calendar}>
      <div className="w-full max-w-3xl">
        <Toolbar />
        <Suspense fallback={<Loading />}>
          <WeekContentWithSlots />
        </Suspense>
      </div>
    </CalendarProvider>
  );
}

function WeekContentWithSlots() {
  const calendar = useCalendar<Event>();
  const { start, end } = calendar.dateRange;

  const { data: events } = useSuspenseQuery({
    queryKey: ['events-slots', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });

  const { data: week } = useView({ data: events });

  // Get time slots from the first day to render the time column
  const timeSlots = week.days[0]?.timeSlots ?? [];

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header row with weekdays */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-fd-muted/20">
        <div className="p-2" />
        {week.days.map((day) => (
          <div key={day.date.toString()} className="p-2 text-center border-l">
            <div className="text-xs text-fd-muted-foreground">
              {day.date.toLocaleString('en', { weekday: 'short' })}
            </div>
            <div className={`text-lg ${day.isToday ? 'bg-fd-primary text-fd-primary-foreground rounded-full w-8 h-8 inline-flex items-center justify-center mx-auto' : ''}`}>
              {day.date.day}
            </div>
          </div>
        ))}
      </div>
      {/* Time slots grid */}
      <div className="max-h-[400px] overflow-y-auto">
        {timeSlots.map((slot, slotIndex) => (
          <div key={`${slot.hour}-${slot.minute}`} className="grid grid-cols-[60px_repeat(7,1fr)] border-b last:border-b-0">
            <div className="p-2 text-xs text-fd-muted-foreground border-r bg-fd-muted/10">
              {slot.time.toLocaleString('en', { hour: 'numeric' })}
            </div>
            {week.days.map((day) => {
              const daySlot = day.timeSlots?.[slotIndex];
              return (
                <div key={day.date.toString()} className="min-h-[48px] p-1 border-l relative">
                  {daySlot?.items.map((event) => (
                    <div key={event.id} className="text-xs bg-fd-primary text-fd-primary-foreground rounded px-1 py-0.5 truncate">
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Shared Components
// =============================================================================

function Toolbar() {
  const calendar = useCalendar<Event>();
  return (
    <div className="flex items-center justify-between mb-4">
      <button onClick={() => calendar.previous()} className="p-2 rounded hover:bg-fd-muted">
        ←
      </button>
      <h2 className="text-lg font-semibold">{calendar.getTitle()}</h2>
      <button onClick={() => calendar.next()} className="p-2 rounded hover:bg-fd-muted">
        →
      </button>
    </div>
  );
}

function WeekdayHeaders() {
  return (
    <div className="grid grid-cols-7 mb-1">
      {getWeekdays(1).map((day) => (
        <div key={day} className="text-center text-xs text-fd-muted-foreground py-1">{day}</div>
      ))}
    </div>
  );
}

function Loading() {
  return (
    <div className="h-[300px] flex items-center justify-center text-fd-muted-foreground">
      Loading...
    </div>
  );
}

// =============================================================================
// Code Snippets
// =============================================================================

const simpleCode = `import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useCreateCalendar, useCalendar, useView, CalendarProvider, getWeekdays } from '@gobrand/react-calendar';
import { Temporal } from '@js-temporal/polyfill';

type Event = { id: string; date: string; title: string };

const accessor = { getDate: (e: Event) => Temporal.PlainDate.from(e.date) };

function SimpleWeekCalendar() {
  const calendar = useCreateCalendar<Event>({
    views: { week: { accessor, weekStartsOn: 1 } },
  });

  return (
    <CalendarProvider calendar={calendar}>
      <Toolbar />
      <WeekdayHeaders />
      <Suspense fallback={<Loading />}>
        <WeekContent />
      </Suspense>
    </CalendarProvider>
  );
}

function WeekContent() {
  const calendar = useCalendar<Event>();
  const { start, end } = calendar.dateRange;

  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });

  const { data: week } = useView({ data: events });

  return (
    <div className="grid grid-cols-7">
      {week.days.map(day => (
        <div key={day.date.toString()}>
          <div className={day.isToday ? 'font-bold' : ''}>{day.date.day}</div>
          {day.items.map(event => (
            <div key={event.id}>{event.title}</div>
          ))}
        </div>
      ))}
    </div>
  );
}`;

const slotsCode = `import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useCreateCalendar, useCalendar, useView, CalendarProvider } from '@gobrand/react-calendar';
import { Temporal } from '@js-temporal/polyfill';

type Event = { id: string; date: string; title: string };

const accessor = { getDate: (e: Event) => Temporal.PlainDate.from(e.date) };

function WeekCalendarWithSlots() {
  const calendar = useCreateCalendar<Event>({
    views: { week: { accessor, weekStartsOn: 1, startHour: 0, endHour: 24, slotDuration: 60 } },
  });

  return (
    <CalendarProvider calendar={calendar}>
      <Toolbar />
      <Suspense fallback={<Loading />}>
        <WeekContent />
      </Suspense>
    </CalendarProvider>
  );
}

function WeekContent() {
  const calendar = useCalendar<Event>();
  const { start, end } = calendar.dateRange;

  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });

  const { data: week } = useView({ data: events });
  const timeSlots = week.days[0]?.timeSlots ?? [];

  return (
    <div>
      {/* Header with weekdays */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        <div />
        {week.days.map(day => (
          <div key={day.date.toString()} className={day.isToday ? 'font-bold' : ''}>
            {day.date.toLocaleString('en', { weekday: 'short', day: 'numeric' })}
          </div>
        ))}
      </div>
      {/* Time slots */}
      {timeSlots.map((slot, i) => (
        <div key={\`\${slot.hour}-\${slot.minute}\`} className="grid grid-cols-[60px_repeat(7,1fr)]">
          <div>{slot.time.toLocaleString('en', { hour: 'numeric' })}</div>
          {week.days.map(day => (
            <div key={day.date.toString()}>
              {day.timeSlots?.[i]?.items.map(event => (
                <div key={event.id}>{event.title}</div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}`;

// =============================================================================
// Exports
// =============================================================================

export function SimpleWeekViewPreview() {
  return (
    <Preview code={simpleCode}>
      <SimpleWeekCalendar />
    </Preview>
  );
}

export function WeekViewWithSlotsPreview() {
  return (
    <Preview code={slotsCode}>
      <WeekCalendarWithSlots />
    </Preview>
  );
}
