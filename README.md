# @gobrand/calendar

[![npm version](https://img.shields.io/npm/v/@gobrand/calendar-core.svg)](https://www.npmjs.com/package/@gobrand/calendar-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Build calendars with the [Temporal API](https://tc39.es/proposal-temporal/docs/). Type-safe. Timezone-aware. Zero abstractions.

## Install

```bash
# React
pnpm add @gobrand/react-calendar

# Core only (vanilla JS/TS)
pnpm add @gobrand/calendar-core
```

## Quick Start

```tsx
import { useCreateCalendar, useView, CalendarProvider, getWeekdays } from '@gobrand/react-calendar';
import { useSuspenseQuery } from '@tanstack/react-query';

type Event = {
  id: string;
  title: string;
  date: string; // ISO date
};

const accessor = {
  getDate: (e: Event) => Temporal.PlainDate.from(e.date),
};

function App() {
  const calendar = useCreateCalendar<Event>({
    views: { month: { accessor }, week: { accessor } },
  });

  return (
    <CalendarProvider calendar={calendar}>
      <CalendarView />
    </CalendarProvider>
  );
}

function CalendarView() {
  const { data: events } = useSuspenseQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  const view = useView({ data: events });

  if (view.type === 'month') {
    return (
      <div className="grid grid-cols-7">
        {getWeekdays().map(day => <div key={day}>{day}</div>)}
        {view.data.weeks.flat().map(day => (
          <div key={day.date.toString()} className={day.isToday ? 'bg-blue-100' : ''}>
            {day.date.day}
            {day.items.map(e => <div key={e.id}>{e.title}</div>)}
          </div>
        ))}
      </div>
    );
  }

  if (view.type === 'week') {
    return (
      <div className="flex">
        {view.data.days.map(day => (
          <div key={day.date.toString()} className="flex-1">
            <div className={day.isToday ? 'font-bold' : ''}>{day.date.day}</div>
            {day.items.map(e => <div key={e.id}>{e.title}</div>)}
          </div>
        ))}
      </div>
    );
  }
}
```

---

## Core API

### `createCalendar(options)`

Creates a calendar instance with state management.

```ts
import { createCalendar } from '@gobrand/calendar-core';

const calendar = createCalendar<Event>({
  views: {
    month: { accessor, weekStartsOn: 1 },
    week: { accessor, weekStartsOn: 1, startHour: 8, endHour: 18, slotDuration: 30 },
    day: { accessor, startHour: 8, endHour: 18, slotDuration: 30 },
  },
  timeZone: 'America/New_York', // optional, defaults to system
});
```

#### Calendar Methods

| Method | Description |
|--------|-------------|
| `getMonth(data?)` | Get month grid (only if month view configured) |
| `getWeek(data?)` | Get week grid (only if week view configured) |
| `getDay(data?)` | Get day grid (only if day view configured) |
| `getTitle(view?, locale?, options?)` | Formatted title for current or specified view |
| `next(view?)` | Navigate forward (month/week/day based on current view) |
| `previous(view?)` | Navigate backward |
| `goToToday()` | Jump to today |
| `goToDate(date)` | Jump to specific date |
| `nextMonth()` / `previousMonth()` | Month navigation |
| `nextWeek()` / `previousWeek()` | Week navigation |
| `nextDay()` / `previousDay()` | Day navigation |
| `goToMonth(year, month)` | Jump to specific month |
| `setCurrentView(view)` | Switch between configured views |
| `getState()` | Get current state |
| `setState(updater)` | Update state |
| `dateRange` | Current view's date range as `ZonedDateTime` |
| `getDateRange(view?)` | Get date range for specific view |

### `createCalendarViews<T>()(views)`

Type-safe view configuration helper.

```ts
const views = createCalendarViews<Event>()({
  month: { accessor, weekStartsOn: 1 },
  week: { accessor, startHour: 9, endHour: 17, slotDuration: 30 },
});
```

### `createCalendarAccessor<T>(accessor)`

Type helper for accessor objects.

```ts
const accessor = createCalendarAccessor<Event>({
  getDate: (e) => e.date,           // required: maps item to PlainDate
  getStart: (e) => e.startTime,     // optional: for time-based views
  getEnd: (e) => e.endTime,         // optional: for duration calculation
});
```

### Build Functions

Low-level functions for building calendar grids without state.

```ts
import { buildMonth, buildWeek, buildDay } from '@gobrand/calendar-core';

const month = buildMonth(2025, 1, { weekStartsOn: 1, data: events, accessor });
const week = buildWeek(Temporal.PlainDate.from('2025-01-15'), { weekStartsOn: 1, data: events, accessor });
const day = buildDay(Temporal.PlainDate.from('2025-01-15'), { startHour: 8, endHour: 18, slotDuration: 30, data: events, accessor });
```

### Formatting Utilities

```ts
import { getWeekdays, getMonthName, formatTime } from '@gobrand/calendar-core';

getWeekdays(1);                    // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
getWeekdays(0, 'es-ES', 'long');   // ["domingo", "lunes", ...]
getMonthName(month.month);         // "January"
formatTime(Temporal.PlainTime.from('14:30')); // "2:30 PM"
```

### Date Range Utilities

```ts
import { getMonthDateRange, getWeekDateRange, getDayDateRange } from '@gobrand/calendar-core';

const monthRange = getMonthDateRange(date, 'America/New_York', { weekStartsOn: 1 });
const weekRange = getWeekDateRange(date, 'UTC');
const dayRange = getDayDateRange(date, 'Europe/London');
// Returns { start: ZonedDateTime, end: ZonedDateTime }
```

### Timezone Utilities

```ts
import { getCurrentTimeZone, convertToTimezone, createZonedDateTime } from '@gobrand/calendar-core';

getCurrentTimeZone();                              // "America/New_York"
convertToTimezone(zdt, 'Europe/London');          // Same instant, different timezone
createZonedDateTime(date, time, 'Asia/Tokyo');    // Combine date + time + timezone
```

---

## React API

The React package re-exports everything from core, plus:

### `useCreateCalendar(options)`

Creates a calendar instance with React state management.

```tsx
const calendar = useCreateCalendar<Event>({
  views: { month: { accessor } },
  timeZone: 'UTC',
  onStateChange: (state) => console.log(state),
});
```

### `CalendarProvider` / `useCalendar`

Provide and consume calendar via context.

```tsx
<CalendarProvider calendar={calendar}>
  <Toolbar />    {/* useCalendar() works here */}
  <Grid />
</CalendarProvider>

function Toolbar() {
  const calendar = useCalendar<Event>();
  return <button onClick={calendar.goToToday}>Today</button>;
}
```

### `useView(options)`

Get memoized view data. Returns discriminated union based on current view.

```tsx
// Dynamic - returns { type: 'month' | 'week' | 'day', data: ... }
const view = useView({ data: events });

// Specific view - always returns that type
const month = useView({ data: events, name: 'month' });
const week = useView({ data: events, name: 'week' });

// With explicit calendar (no context needed)
const view = useView({ data: events, calendar });
```

---

## Types

### Data Structures

```ts
type CalendarMonth<T> = {
  weeks: CalendarDay<T>[][];
  month: Temporal.PlainYearMonth;
};

type CalendarDay<T> = {
  date: Temporal.PlainDate;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: T[];
};

type CalendarWeekView<T> = {
  days: WeekDay<T>[];
  weekStart: Temporal.PlainDate;
  weekEnd: Temporal.PlainDate;
};

type WeekDay<T> = {
  date: Temporal.PlainDate;
  isToday: boolean;
  items: T[];
  timeSlots?: TimeSlot<T>[];
};

type CalendarDayView<T> = {
  date: Temporal.PlainDate;
  isToday: boolean;
  timeSlots: TimeSlot<T>[];
  items: T[];
};

type TimeSlot<T> = {
  hour: number;
  minute: number;
  time: Temporal.PlainTime;
  items: T[];
};

type DateRange = {
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
};
```

### View Options

```ts
type MonthViewOptions<T> = {
  accessor: CalendarAccessor<T>;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday
};

type WeekViewOptions<T> = {
  accessor: CalendarAccessor<T>;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startHour?: number;     // default: 0
  endHour?: number;       // default: 24
  slotDuration?: number;  // minutes, default: 60
};

type DayViewOptions<T> = {
  accessor: CalendarAccessor<T>;
  startHour?: number;
  endHour?: number;
  slotDuration?: number;
};
```

---

## Why temporal-calendar?

- **Built on Temporal API** - No Date objects, no moment.js, no date-fns
- **Type-safe** - Conditional methods based on configured views
- **Timezone-aware** - Native DST handling with IANA timezones
- **Zero config** - Sensible defaults, customize what you need
- **Minimal** - ~5KB gzipped, no runtime dependencies beyond polyfill

---

## License

MIT

## Built by [Go Brand](https://gobrand.app)
