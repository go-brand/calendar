'use client';

import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useCreateCalendar, useCalendar, useView, CalendarProvider } from '@gobrand/react-calendar';
import { Preview } from '@/components/preview';
import { type Event, fetchEvents, accessor } from './mock-data';

function DayCalendar() {
  const calendar = useCreateCalendar<Event>({
    views: { day: { accessor, startHour: 0, endHour: 24, slotDuration: 60 } },
  });

  return (
    <CalendarProvider calendar={calendar}>
      <div className="w-full max-w-md">
        <Toolbar />
        <Suspense fallback={<Loading />}>
          <DayContent />
        </Suspense>
      </div>
    </CalendarProvider>
  );
}

function Toolbar() {
  const calendar = useCalendar<Event>();
  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={() => calendar.previous()}
        className="p-2 rounded hover:bg-fd-muted"
      >
        ←
      </button>
      <h2 className="text-lg font-semibold">{calendar.getTitle()}</h2>
      <button
        onClick={() => calendar.next()}
        className="p-2 rounded hover:bg-fd-muted"
      >
        →
      </button>
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

function DayContent() {
  const calendar = useCalendar<Event>();
  const { start, end } = calendar.dateRange;

  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });

  const { data: day } = useView({ data: events });

  return (
    <>
      {day.isToday && (
        <div className="text-center text-sm text-fd-primary font-medium mb-2">Today</div>
      )}
      <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
        {day.timeSlots.map((slot) => (
          <div key={`${slot.hour}-${slot.minute}`} className="flex border-b last:border-b-0 min-h-[48px]">
            <div className="w-16 p-2 text-sm text-fd-muted-foreground border-r bg-fd-muted/20 flex-shrink-0">
              {slot.time.toLocaleString('en', { hour: 'numeric' })}
            </div>
            <div className="flex-1 p-1">
              {slot.items.map((event) => (
                <div key={event.id} className="text-sm bg-fd-primary text-fd-primary-foreground rounded px-2 py-1">
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const code = `import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useCreateCalendar, useCalendar, useView, CalendarProvider } from '@gobrand/react-calendar';
import { Temporal } from '@js-temporal/polyfill';

type Event = { id: string; date: string; title: string };

const accessor = { getDate: (e: Event) => Temporal.PlainDate.from(e.date) };

function DayCalendar() {
  const calendar = useCreateCalendar<Event>({
    views: { day: { accessor, startHour: 0, endHour: 24, slotDuration: 60 } },
  });

  return (
    <CalendarProvider calendar={calendar}>
      <Toolbar />
      <Suspense fallback={<Loading />}>
        <DayContent />
      </Suspense>
    </CalendarProvider>
  );
}

function Toolbar() {
  const calendar = useCalendar<Event>();
  return (
    <header>
      <button onClick={() => calendar.previous()}>←</button>
      <h2>{calendar.getTitle()}</h2>
      <button onClick={() => calendar.next()}>→</button>
    </header>
  );
}

function DayContent() {
  const calendar = useCalendar<Event>();
  const { start, end } = calendar.dateRange;

  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });

  const { data: day } = useView({ data: events });

  return (
    <div>
      {day.timeSlots.map(slot => (
        <div key={\`\${slot.hour}-\${slot.minute}\`} className="flex border-t h-12">
          <div className="w-16 text-sm">
            {slot.time.toLocaleString('en', { hour: 'numeric' })}
          </div>
          <div className="flex-1">
            {slot.items.map(event => (
              <div key={event.id}>{event.title}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}`;

export function DayViewPreview() {
  return (
    <Preview code={code}>
      <DayCalendar />
    </Preview>
  );
}
