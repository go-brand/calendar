'use client';

import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useCreateCalendar, useCalendar, useView, CalendarProvider, getWeekdays } from '@gobrand/react-calendar';
import { Temporal } from '@js-temporal/polyfill';
import { Preview } from '@/components/preview';
import { type Event, fetchEvents, accessor } from './mock-data';

function MultiViewCalendar() {
  const calendar = useCreateCalendar<Event>({
    views: {
      month: { accessor, weekStartsOn: 1 },
      week: { accessor, weekStartsOn: 1 },
      day: { accessor },
    },
  });

  return (
    <CalendarProvider calendar={calendar}>
      <div className="w-full max-w-2xl">
        <Toolbar />
        <CalendarHeader />
        <Suspense fallback={<Loading />}>
          <ViewContent />
        </Suspense>
      </div>
    </CalendarProvider>
  );
}

function Toolbar() {
  const calendar = useCalendar<Event>();
  return (
    <>
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
      <div className="flex gap-1 mb-4 justify-center">
        {calendar.views.map((view) => (
          <button
            key={view}
            onClick={() => calendar.setCurrentView(view)}
            className={`px-3 py-1 text-sm rounded ${
              calendar.currentView === view
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'bg-fd-muted hover:bg-fd-muted/80'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
    </>
  );
}

function CalendarHeader() {
  const calendar = useCalendar<Event>();

  // Show weekday headers for month and week views
  if (calendar.currentView === 'month' || calendar.currentView === 'week') {
    return (
      <div className="grid grid-cols-7 mb-1">
        {getWeekdays(1).map((day) => (
          <div key={day} className="text-center text-xs text-fd-muted-foreground py-1">{day}</div>
        ))}
      </div>
    );
  }

  return null;
}

function Loading() {
  return (
    <div className="h-[400px] flex items-center justify-center text-fd-muted-foreground">
      Loading...
    </div>
  );
}

function ViewContent() {
  const calendar = useCalendar<Event>();
  const { start, end } = calendar.dateRange;

  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });

  const view = useView({ data: events });

  switch (view.type) {
    case 'month':
      return <MonthView month={view.data} />;
    case 'week':
      return <WeekView week={view.data} />;
    case 'day':
      return <DayView day={view.data} />;
  }
}

function MonthView({ month }: { month: ReturnType<typeof useView<Event>>['data'] & { weeks: unknown[] } }) {
  return (
    <div className="grid grid-cols-7 gap-0.5">
      {(month as { weeks: { id: string; date: Temporal.PlainDate; isCurrentMonth: boolean; isToday: boolean; items: Event[] }[][] }).weeks.flat().map((day) => (
        <div
          key={day.id}
          className={`min-h-[60px] p-1 rounded border text-xs ${day.isCurrentMonth ? 'bg-fd-card' : 'bg-fd-muted/30'}`}
        >
          <span className={day.isToday ? 'bg-fd-primary text-fd-primary-foreground rounded-full w-5 h-5 inline-flex items-center justify-center text-xs' : ''}>
            {day.date.day}
          </span>
          {day.items.map((e) => (
            <div key={e.id} className="truncate text-xs text-fd-primary">{e.title}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

function WeekView({ week }: { week: { days: { id: string; date: Temporal.PlainDate; isToday: boolean; items: Event[] }[] } }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {week.days.map((day) => (
        <div key={day.id} className="text-center">
          <div className={`text-lg mb-2 ${day.isToday ? 'bg-fd-primary text-fd-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
            {day.date.day}
          </div>
          <div className="space-y-1">
            {day.items.map((e) => (
              <div key={e.id} className="text-xs bg-fd-primary text-fd-primary-foreground rounded px-1 py-0.5 truncate">
                {e.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DayView({ day }: { day: { id: string; date: Temporal.PlainDate; isToday: boolean; items: Event[] } }) {
  return (
    <div className="text-center">
      {day.isToday && <div className="text-sm text-fd-primary mb-4">Today</div>}
      <div className="space-y-2">
        {day.items.length > 0 ? (
          day.items.map((e) => (
            <div key={e.id} className="bg-fd-primary text-fd-primary-foreground rounded px-3 py-2">
              {e.title}
            </div>
          ))
        ) : (
          <div className="text-fd-muted-foreground">No events</div>
        )}
      </div>
    </div>
  );
}

const code = `import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useCreateCalendar, useCalendar, useView, CalendarProvider, getWeekdays } from '@gobrand/react-calendar';
import { Temporal } from '@js-temporal/polyfill';

type Event = { id: string; date: string; title: string };

const accessor = { getDate: (e: Event) => Temporal.PlainDate.from(e.date) };

function MultiViewCalendar() {
  const calendar = useCreateCalendar<Event>({
    views: {
      month: { accessor, weekStartsOn: 1 },
      week: { accessor, weekStartsOn: 1 },
      day: { accessor },
    },
  });

  return (
    <CalendarProvider calendar={calendar}>
      <Toolbar />
      <CalendarHeader />
      <Suspense fallback={<Loading />}>
        <ViewContent />
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
      <div>
        {calendar.views.map(view => (
          <button
            key={view}
            onClick={() => calendar.setCurrentView(view)}
            className={calendar.currentView === view ? 'active' : ''}
          >
            {view}
          </button>
        ))}
      </div>
    </header>
  );
}

function CalendarHeader() {
  const calendar = useCalendar<Event>();

  if (calendar.currentView === 'month' || calendar.currentView === 'week') {
    return (
      <div className="grid grid-cols-7">
        {getWeekdays(1).map(day => <div key={day}>{day}</div>)}
      </div>
    );
  }
  return null;
}

function ViewContent() {
  const calendar = useCalendar<Event>();
  const { start, end } = calendar.dateRange;

  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });

  const view = useView({ data: events });

  switch (view.type) {
    case 'month':
      return <MonthGrid month={view.data} />;
    case 'week':
      return <WeekGrid week={view.data} />;
    case 'day':
      return <DayGrid day={view.data} />;
  }
}`;

export function MultiViewPreview() {
  return (
    <Preview code={code}>
      <MultiViewCalendar />
    </Preview>
  );
}
