"use client";

import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  useCreateCalendar,
  useCalendar,
  useView,
  CalendarProvider,
  getWeekdays,
} from "@gobrand/react-calendar";
import { Preview } from "@/components/preview";
import { type Event, fetchEvents, accessor } from "./mock-data";

function MonthCalendar() {
  const calendar = useCreateCalendar<Event>({
    views: { month: { accessor, weekStartsOn: 1 } },
  });

  return (
    <CalendarProvider calendar={calendar}>
      <div className="w-full max-w-2xl">
        <Toolbar />
        <WeekdayHeaders />
        <Suspense fallback={<Loading />}>
          <MonthContent />
        </Suspense>
      </div>
    </CalendarProvider>
  );
}

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
    <div className="grid grid-cols-7 mb-2">
      {getWeekdays(1).map((day) => (
        <div key={day} className="text-center text-sm font-medium text-fd-muted-foreground py-2">
          {day}
        </div>
      ))}
    </div>
  );
}

function Loading() {
  return (
    <div className="h-[400px] flex items-center justify-center text-fd-muted-foreground">
      Loading...
    </div>
  );
}

function MonthContent() {
  const calendar = useCalendar<Event>();
  const { start, end } = calendar.dateRange;

  const { data: events } = useSuspenseQuery({
    queryKey: ["events", start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });

  const { data: month } = useView({ data: events, name: "month" });

  return (
    <div className="grid grid-cols-7 gap-1">
      {month.weeks.flat().map((day) => (
        <div
          key={day.id}
          className={`min-h-[80px] p-2 rounded-lg border ${day.isCurrentMonth ? "bg-fd-card border-fd-border" : "bg-fd-muted/20 border-transparent opacity-40"}`}
        >
          <span
            className={`text-sm inline-flex items-center justify-center size-6 rounded-full ${day.isToday ? "bg-fd-primary text-fd-primary-foreground font-medium" : ""} ${!day.isCurrentMonth ? "text-fd-muted-foreground" : ""}`}
          >
            {day.date.day}
          </span>
          <div className="mt-1 space-y-1">
            {day.items.map((event) => (
              <div
                key={event.id}
                className={`text-xs rounded px-1.5 py-0.5 truncate ${day.isCurrentMonth ? "bg-fd-primary text-fd-primary-foreground" : "bg-fd-muted-foreground/50 text-fd-muted"}`}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const code = `import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useCreateCalendar, useCalendar, useView, CalendarProvider, getWeekdays } from '@gobrand/react-calendar';
import { Temporal } from '@js-temporal/polyfill';

type Event = { id: string; date: string; title: string };

const accessor = { getDate: (e: Event) => Temporal.PlainDate.from(e.date) };

function MonthCalendar() {
  const calendar = useCreateCalendar<Event>({
    views: { month: { accessor, weekStartsOn: 1 } },
  });

  return (
    <CalendarProvider calendar={calendar}>
      <Toolbar />
      <WeekdayHeaders />
      <Suspense fallback={<Loading />}>
        <MonthContent />
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

function WeekdayHeaders() {
  return (
    <div className="grid grid-cols-7">
      {getWeekdays(1).map(day => <div key={day}>{day}</div>)}
    </div>
  );
}

function MonthContent() {
  const calendar = useCalendar<Event>();
  const { start, end } = calendar.dateRange;

  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });

  const { data: month } = useView({ data: events });

  return (
    <div className="grid grid-cols-7">
      {month.weeks.flat().map(day => (
        <div key={day.id} className={day.isCurrentMonth ? '' : 'opacity-40'}>
          <span className={day.isToday ? 'font-bold' : ''}>{day.date.day}</span>
          {day.items.map(event => (
            <div key={event.id}>{event.title}</div>
          ))}
        </div>
      ))}
    </div>
  );
}`;

export function BasicMonthPreview() {
  return (
    <Preview code={code}>
      <MonthCalendar />
    </Preview>
  );
}
