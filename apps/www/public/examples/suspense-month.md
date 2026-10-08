# suspense-month

Render the exported StandaloneSuspenseMonth from suspense-standalone.tsx in your React application.

Keep the files together in one directory. Install @gobrand/react-calendar and the dependencies below. CSS utility classes are optional; rendering and controls work without them. Website appearance requires the website styles.

Dependencies: @gobrand/react-calendar@*, @js-temporal/polyfill@0.5.1, react@19, tailwind-merge@^3.3.1, @tanstack/react-query@^5.90.0, react-dom@19.

### suspense-month.tsx

```tsx
'use client';

import { Suspense } from 'react';
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
  CalendarToolbar,
  CalendarWeekdays,
} from './calendar-ui';
import { accessor, fetchEvents } from './mock-data';

export function SuspenseMonthExample() {
  const calendar = useCreateCalendar({ views: { month: true } });

  return (
    <CalendarProvider calendar={calendar}>
      <MonthCalendar />
    </CalendarProvider>
  );
}

function MonthCalendar() {
  const calendar = useCalendar();

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
      <Suspense fallback={<div>Loading events…</div>}>
        <MonthContent />
      </Suspense>
    </Calendar>
  );
}

function MonthContent() {
  const calendar = useCalendar();
  const { start, end } = calendar.visibleRange;
  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  });
  const month = useCalendarView({
    view: 'month',
    items: events,
    getDate: accessor.getDate,
  });

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
```

### calendar-ui.tsx

```tsx
import type { Temporal } from "@js-temporal/polyfill";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function Button({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-lg px-3 py-2 text-sm text-fd-muted-foreground transition-colors",
        "hover:bg-fd-muted hover:text-fd-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
        active && "bg-fd-primary text-fd-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Calendar({
  children,
  size = "month",
}: {
  children: ReactNode;
  size?: "month" | "day" | "wide";
}) {
  const widths = { month: "max-w-2xl", day: "max-w-md", wide: "max-w-3xl" };
  return <div className={cn("w-full min-w-0", widths[size])}>{children}</div>;
}

export function CalendarToolbar({
  title,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
  children,
}: {
  title: string;
  onPrevious: () => void;
  onNext: () => void;
  previousLabel: string;
  nextLabel: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Button aria-label={previousLabel} onClick={onPrevious}>
          ←
        </Button>
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button aria-label={nextLabel} onClick={onNext}>
          →
        </Button>
      </div>
      {children && <div className="flex justify-center gap-1">{children}</div>}
    </div>
  );
}

export function CalendarWeekdays({ start }: { start: Temporal.PlainDate }) {
  const days = Array.from({ length: 7 }, (_, index) =>
    start.add({ days: index }).toLocaleString("en-US", { weekday: "short" }),
  );
  return (
    <div className="mb-2 grid grid-cols-7">
      {days.map((day) => (
        <div key={day} className="py-2 text-center text-xs text-fd-muted-foreground">
          {day}
        </div>
      ))}
    </div>
  );
}

export function CalendarGrid({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

export function CalendarRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-7 gap-1">{children}</div>;
}

export function CalendarCell({
  date,
  current = true,
  today = false,
  children,
}: {
  date: Temporal.PlainDate;
  current?: boolean;
  today?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-h-20 rounded-lg border p-2",
        current ? "border-fd-border bg-fd-card" : "border-transparent opacity-40",
      )}
    >
      <span
        className={cn(
          "inline-grid size-6 place-items-center rounded-full text-sm",
          today && "bg-sky-500 font-medium text-white",
        )}
      >
        {date.day}
      </span>
      {children && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
}

export function CalendarEvent({ children }: { children: ReactNode }) {
  return (
    <div className="truncate rounded bg-sky-500 px-1.5 py-0.5 text-xs text-white">
      {children}
    </div>
  );
}

export function CalendarTimeline({ children }: { children: ReactNode }) {
  return (
    <div className="max-h-96 overflow-y-auto rounded-lg border border-fd-border">
      {children}
    </div>
  );
}

export function CalendarTimeRow({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="grid min-h-12 grid-cols-[4.5rem_1fr] border-b border-fd-border last:border-b-0">
      <div className="border-r border-fd-border p-2 text-xs text-fd-muted-foreground">
        {label}
      </div>
      <div className="min-w-0 p-2">{children}</div>
    </div>
  );
}

type WeekHeaderDay = {
  id: string;
  date: Temporal.PlainDate;
  isToday: boolean;
};

export function CalendarWeekHeader({ days }: { days: readonly WeekHeaderDay[] }) {
  return (
    <div className="grid grid-cols-[3.75rem_repeat(7,minmax(0,1fr))] border-b border-fd-border bg-fd-muted/20">
      <div />
      {days.map((day) => (
        <div key={day.id} className="border-l border-fd-border p-2 text-center">
          <div className="text-xs text-fd-muted-foreground">
            {day.date.toLocaleString("en", { weekday: "short" })}
          </div>
          <div
            className={cn(
              "mx-auto mt-1 grid size-8 place-items-center rounded-full",
              day.isToday && "bg-sky-500 text-white",
            )}
          >
            {day.date.day}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarTimeGrid({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-fd-border">
      {header}
      <div className="max-h-96 overflow-y-auto">{children}</div>
    </div>
  );
}

export function CalendarTimeGridRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[3.75rem_repeat(7,minmax(0,1fr))] border-b border-fd-border last:border-b-0">
      <div className="border-r border-fd-border bg-fd-muted/10 p-2 text-xs text-fd-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

export function CalendarTimeCell({ children }: { children?: ReactNode }) {
  return <div className="min-h-12 min-w-0 border-l border-fd-border p-1">{children}</div>;
}
```

### mock-data.ts

```ts
import { Temporal } from '@js-temporal/polyfill';

export type Event = {
  id: string;
  date: string;
  start?: string; // ISO ZonedDateTime string for time-aware events
  title: string;
};

const titles = [
  'Standup',
  'Planning',
  'Review',
  'Launch',
  'Demo',
  'Retro',
  'Sprint',
  'Deploy',
  'Sync',
  'Lunch',
];

// Generate events around the current date so calendars are never empty
function generateEvents(): Event[] {
  const timeZone = Temporal.Now.timeZoneId();
  const today = Temporal.Now.plainDateISO();
  const events: Event[] = [];

  // Generate events for -2 months to +2 months
  for (let monthOffset = -2; monthOffset <= 2; monthOffset++) {
    const month = today.add({ months: monthOffset });
    const daysInMonth = month.daysInMonth;

    // Add events on various days throughout each month
    const eventDays = [3, 5, 8, 12, 15, 18, 22, 25, 28].filter((d) => d <= daysInMonth);
    eventDays.forEach((day, i) => {
      const date = month.with({ day });
      events.push({
        id: `${monthOffset}-${day}`,
        date: date.toString(),
        title: titles[(monthOffset + 2 + i) % titles.length],
      });
    });
  }

  // Add 2 events for today at specific times (9 AM and 11 AM - visible in week view's first 5 slots)
  const todayAt9am = today.toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from('09:00'),
  });
  const todayAt11am = today.toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from('11:00'),
  });

  events.push({
    id: 'today-9am',
    date: today.toString(),
    start: todayAt9am.toString(),
    title: 'Team Sync',
  });

  events.push({
    id: 'today-11am',
    date: today.toString(),
    start: todayAt11am.toString(),
    title: 'Project Review',
  });

  // Add extra events around today for day/week views (excluding today itself)
  // Give them times within the 8-18 range so they show in time slots
  for (let dayOffset = -3; dayOffset <= 3; dayOffset++) {
    if (dayOffset === 0) continue; // Skip today, we already added specific events
    const date = today.add({ days: dayOffset });
    const hour = 9 + Math.abs(dayOffset); // Vary the time: 10, 11, 12 AM
    const startTime = date.toZonedDateTime({
      timeZone,
      plainTime: Temporal.PlainTime.from({ hour, minute: 0 }),
    });
    events.push({
      id: `nearby-${dayOffset}`,
      date: date.toString(),
      start: startTime.toString(),
      title: titles[(dayOffset + 3) % titles.length],
    });
  }

  return events;
}

export const events = generateEvents();

export async function fetchEvents(
  start: Temporal.ZonedDateTime,
  end: Temporal.ZonedDateTime,
): Promise<Event[]> {
  await new Promise((r) => setTimeout(r, 300));
  return events.filter((e) => {
    const date = Temporal.PlainDate.from(e.date);
    return (
      Temporal.PlainDate.compare(date, start.toPlainDate()) >= 0 &&
      Temporal.PlainDate.compare(date, end.toPlainDate()) < 0
    );
  });
}

// Get the browser's timezone for consistent time handling
const browserTimeZone = Temporal.Now.timeZoneId();

export const accessor = {
  getDate: (e: Event) => Temporal.PlainDate.from(e.date),
  getStart: (e: Event) => {
    if (e.start) {
      return Temporal.ZonedDateTime.from(e.start);
    }
    // Default to midnight in browser timezone for events without specific time
    return Temporal.PlainDate.from(e.date).toZonedDateTime({
      timeZone: browserTimeZone,
      plainTime: Temporal.PlainTime.from('00:00'),
    });
  },
};
```

### cn.ts

```ts
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(inputs.filter(Boolean).join(' '));
}
```

### suspense-standalone.tsx

```tsx
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuspenseMonthExample } from './suspense-month';

export function StandaloneSuspenseMonth() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <SuspenseMonthExample />
    </QueryClientProvider>
  );
}
```
