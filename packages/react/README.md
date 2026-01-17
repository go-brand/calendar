# @gobrand/react-calendar

React hook for building calendars with the Temporal API.

## Installation

```bash
pnpm add @gobrand/react-calendar
```

## Philosophy

- **Data-agnostic**: Works with any data type (events, tasks, posts, etc.)
- **Type-safe**: Full TypeScript support with TanStack-style type inference
- **Zero abstractions**: Direct use of Temporal API primitives
- **Minimal API surface**: Just a hook and utility functions

## Quick Start

```tsx
import { useCalendar, createCalendarViews, createCalendarAccessor } from '@gobrand/react-calendar';
import { Temporal } from '@js-temporal/polyfill';

type Event = {
  id: string;
  title: string;
  start: Temporal.ZonedDateTime;
};

// Define how to extract dates from your data
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

## Multi-View Calendar

```tsx
import { useCalendar, createCalendarViews } from '@gobrand/react-calendar';

const calendar = useCalendar({
  data: events,
  views: createCalendarViews({
    month: { weekStartsOn: 1, accessor: monthAccessor },
    week: { weekStartsOn: 1, startHour: 8, endHour: 18, accessor: weekAccessor },
    day: { startHour: 8, endHour: 18, slotDuration: 30, accessor: dayAccessor },
  }),
});

// Switch views
calendar.setCurrentView('week');

// Get current view data
const month = calendar.getMonth();  // Type-safe! Only available if month view configured
const week = calendar.getWeek();    // Type-safe! Only available if week view configured
const day = calendar.getDay();      // Type-safe! Only available if day view configured
```

## API

### `useCalendar<TOptions>(options)`

Main hook for calendar state management.

**Options:**
```tsx
{
  data: T[];                          // Your data array
  views: CalendarViewOptions<T>;      // View configurations
  timeZone?: string;                  // IANA timezone (default: system)
  state?: CalendarState;              // External state (for controlled mode)
  onStateChange?: (state) => void;    // State change callback
}
```

**Returns:** `Calendar<T, TOptions>` with methods based on configured views

**Common methods:**
- `getState()` - Get current state
- `setState(updater)` - Update state
- `goToToday()` - Navigate to today
- `goToDate(date)` - Navigate to specific date
- `getTitle(view)` - Get formatted title for view
- `dateRange` - Current date range (for data fetching)
- `currentView` - Current view name
- `setCurrentView(view)` - Switch views

**View-specific methods** (conditionally available based on configured views):

**Month view:**
- `getMonth()` - Returns `{ month: PlainYearMonth, weeks: CalendarWeek<T>[] }`
- `nextMonth()` / `previousMonth()`
- `goToMonth(year, month)`

**Week view:**
- `getWeek()` - Returns `{ weekStart, weekEnd, days: CalendarDay<T>[] }`
- `nextWeek()` / `previousWeek()`

**Day view:**
- `getDay()` - Returns `{ date, timeSlots: { hour, minute, items: T[] }[] }`
- `nextDay()` / `previousDay()`

### `createCalendarViews<T>(config)`

Type-safe builder for view configurations.

```tsx
const views = createCalendarViews<Event>({
  month: {
    weekStartsOn: 1,              // 0 (Sun) - 6 (Sat)
    accessor: monthAccessor,       // CalendarAccessor<Event>
  },
  week: {
    weekStartsOn: 1,
    startHour: 8,                 // 0-23
    endHour: 18,                  // 0-24
    slotDuration: 30,             // Minutes
    accessor: weekAccessor,
  },
  day: {
    startHour: 8,
    endHour: 18,
    slotDuration: 30,
    accessor: dayAccessor,
  },
});
```

### `createCalendarAccessor<T>(config)`

Define how to extract date information from your data.

```tsx
const accessor = createCalendarAccessor<Event>({
  getDate: (item) => Temporal.PlainDate,      // Required
  getStart?: (item) => Temporal.ZonedDateTime, // For time-based views
  getEnd?: (item) => Temporal.ZonedDateTime,   // For time-based views
});
```

### Utility Functions

All utilities from `@gobrand/calendar-core` are re-exported:

**Formatting:**
- `getWeekdays(weekStartsOn?)` - Localized weekday names
- `getMonthName(month, locale?)` - Localized month name
- `formatTime(time, locale?)` - Format PlainTime

**Navigation:**
- `nextMonth(month)` / `previousMonth(month)`
- `nextWeek(date)` / `previousWeek(date)`
- `nextDay(date)` / `previousDay(date)`
- `goToToday()` - Get current PlainDate

**Timezone:**
- `getMonthRange(timeZone?, weekStartsOn?)` - Week-aligned month range
- `getWeekRange(timeZone?, weekStartsOn?)` - Current week range
- `getDayRange(timeZone?)` - Today in timezone
- `getCurrentTimeZone()` - Get system timezone
- `convertToTimezone(zdt, timeZone)` - Convert between timezones
- `createZonedDateTime(date, time, timeZone)` - Create ZonedDateTime

**Layout:**
- `getEventPosition(start, end, startHour, endHour, slotDuration)` - Calculate event positioning for time-based grids

## Data Structures

### `CalendarDay<T>`

```tsx
{
  date: Temporal.PlainDate;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: T[];  // Your data filtered to this day
}
```

### `CalendarWeek<T>`

```tsx
CalendarDay<T>[]  // Array of 7 days
```

### `CalendarMonth<T>`

```tsx
{
  month: Temporal.PlainYearMonth;
  weeks: CalendarWeek<T>[];
}
```

### `CalendarWeekView<T>`

```tsx
{
  weekStart: Temporal.PlainDate;
  weekEnd: Temporal.PlainDate;
  days: CalendarDay<T>[];
}
```

### `CalendarDayView<T>`

```tsx
{
  date: Temporal.PlainDate;
  timeSlots: {
    hour: number;
    minute: number;
    items: T[];  // Items overlapping this time slot
  }[];
}
```

## Type Safety

The hook uses TanStack-style type inference to provide conditional types based on your configuration:

```tsx
// Only month view configured
const calendar = useCalendar({
  data: events,
  views: createCalendarViews({ month: { ... } }),
});

calendar.getMonth();     // ✅ Available
calendar.nextMonth();    // ✅ Available
calendar.getWeek();      // ❌ Type error - week view not configured

// All views configured
const calendar = useCalendar({
  data: events,
  views: createCalendarViews({
    month: { ... },
    week: { ... },
    day: { ... },
  }),
});

calendar.getMonth();     // ✅ Available
calendar.getWeek();      // ✅ Available
calendar.getDay();       // ✅ Available
```

## Examples

See the [demo app](../../apps/demo) for complete examples:
- **Month view**: [PostMonthlyView.tsx](../../apps/demo/src/components/PostMonthlyView.tsx)
- **Week view**: [PostWeeklyView.tsx](../../apps/demo/src/components/PostWeeklyView.tsx)
- **Day view**: [PostDailyView.tsx](../../apps/demo/src/components/PostDailyView.tsx)
- **Custom view**: [PostAgendaView.tsx](../../apps/demo/src/components/PostAgendaView.tsx)

## License

MIT
