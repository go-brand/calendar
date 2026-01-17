# @gobrand/calendar

Calendar utilities built on the [Temporal API](https://tc39.es/proposal-temporal/docs/).

## Packages

- **[@gobrand/calendar-core](./packages/core)** - Framework-agnostic calendar logic
- **[@gobrand/react-calendar](./packages/react)** - React hook and utilities

## Philosophy

- **Temporal-first**: Built exclusively on the Temporal API
- **Zero abstractions**: Direct use of Temporal API primitives
- **Data-agnostic**: Works with any data type through accessor pattern
- **Type-safe**: Full TypeScript support
- **Minimal**: Simple, composable functions

## Installation

```bash
# Core
pnpm add @gobrand/calendar-core

# React
pnpm add @gobrand/react-calendar
```

## Quick Start

### React

```tsx
import { useCalendar, createCalendarViews, createCalendarAccessor, getWeekdays } from '@gobrand/react-calendar';
import { Temporal } from '@js-temporal/polyfill';

type Event = {
  id: string;
  title: string;
  start: Temporal.ZonedDateTime;
};

const accessor = createCalendarAccessor<Event>({
  getDate: (event) => event.start.toPlainDate(),
  getStart: (event) => event.start,
  getEnd: (event) => event.start,
});

function MyCalendar() {
  const calendar = useCalendar({
    data: events,
    views: createCalendarViews({
      month: { weekStartsOn: 1, accessor },
    }),
  });

  const month = calendar.getMonth();

  return (
    <div>
      <header>
        <button onClick={calendar.previousMonth}>←</button>
        <h2>{calendar.getTitle('month')}</h2>
        <button onClick={calendar.nextMonth}>→</button>
        <button onClick={calendar.goToToday}>Today</button>
      </header>

      <div className="grid grid-cols-7 gap-2">
        {getWeekdays(1).map(day => (
          <div key={day}>{day}</div>
        ))}

        {month.weeks.flat().map(day => (
          <div
            key={day.date.toString()}
            className={`
              ${!day.isCurrentMonth && 'opacity-40'}
              ${day.isToday && 'bg-blue-100'}
            `}
          >
            <div>{day.date.day}</div>
            {day.items.map(event => (
              <div key={event.id}>{event.title}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Core (Vanilla JavaScript)

```typescript
import { buildMonth, getWeekdays, getMonthName } from '@gobrand/calendar-core';
import { Temporal } from '@js-temporal/polyfill';

const month = buildMonth(2025, 1, { weekStartsOn: 1 });

console.log(getMonthName(month.month)); // "January"
console.log(getWeekdays(1)); // ["Mon", "Tue", "Wed", ...]

month.weeks.forEach(week => {
  week.forEach(day => {
    console.log(day.date.toString(), day.isCurrentMonth, day.isToday);
  });
});
```

## Key Features

### Multi-View Support

```tsx
const calendar = useCalendar({
  data: events,
  views: createCalendarViews({
    month: { weekStartsOn: 1, accessor: monthAccessor },
    week: { weekStartsOn: 1, startHour: 8, endHour: 18, accessor: weekAccessor },
    day: { startHour: 8, endHour: 18, slotDuration: 30, accessor: dayAccessor },
  }),
});

// Switch between views
calendar.setCurrentView('week');

// Type-safe methods based on configuration
const month = calendar.getMonth();  // Only available if month view configured
const week = calendar.getWeek();    // Only available if week view configured
const day = calendar.getDay();      // Only available if day view configured
```

### Timezone-Aware Date Ranges

```tsx
import { getMonthRange, getWeekRange, getDayRange } from '@gobrand/react-calendar';

const range = getMonthRange('Europe/Madrid', 1);
```

### Data-Agnostic Design

Works with any data type through the accessor pattern:

```tsx
type Task = {
  id: string;
  name: string;
  dueDate: Temporal.PlainDate;
};

const accessor = createCalendarAccessor<Task>({
  getDate: (task) => task.dueDate,
});

const calendar = useCalendar({
  data: tasks,
  views: createCalendarViews({
    month: { weekStartsOn: 1, accessor },
  }),
});
```

## Core API Overview

### Building Calendars

- `buildMonth(year, month, options)` - Build month grid
- `buildWeek(date, options)` - Build week view
- `buildDay(date, options)` - Build day view with time slots

### Navigation

- `nextMonth()`, `previousMonth()`, `goToMonth(year, month)`
- `nextWeek()`, `previousWeek()`
- `nextDay()`, `previousDay()`
- `goToToday()`

### Formatting

- `getWeekdays(weekStartsOn?)` - Localized weekday names
- `getMonthName(month, locale?)` - Localized month name
- `formatTime(time, locale?)` - Format time

### Timezone Utilities

- `getMonthRange(timeZone?, weekStartsOn?)` - Week-aligned month range
- `getWeekRange(timeZone?, weekStartsOn?)` - Current week range
- `getDayRange(timeZone?)` - Today in timezone
- `getCurrentTimeZone()` - Get system timezone
- `convertToTimezone(zdt, timeZone)` - Convert between timezones
- `createZonedDateTime(date, time, timeZone)` - Create ZonedDateTime

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test --run

# Type check
pnpm typecheck
```

## License

MIT
