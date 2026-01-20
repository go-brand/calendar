# @gobrand/calendar

[![npm version](https://img.shields.io/npm/v/@gobrand/calendar-core.svg)](https://www.npmjs.com/package/@gobrand/calendar-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Build powerful calendar views with the [Temporal API](https://tc39.es/proposal-temporal/docs/). Framework-agnostic core with React hooks, full timezone support, and type-safe multi-view calendar management.

## Packages

- **[@gobrand/calendar-core](./packages/core)** - Framework-agnostic calendar logic
- **[@gobrand/react-calendar](./packages/react)** - React hook and utilities

## Installation

```bash
# Core (vanilla JavaScript/TypeScript)
npm install @gobrand/calendar-core
# or
pnpm add @gobrand/calendar-core

# React
npm install @gobrand/react-calendar
# or
pnpm add @gobrand/react-calendar
```

## Why temporal-calendar?

Building calendars is complex: timezone handling, DST transitions, multi-view state management, and data mapping. **temporal-calendar** (`@gobrand/calendar`) provides a complete solution:

- **📅 Multi-view support** - Month, week, and day views with type-safe view switching
- **🌍 Timezone-aware** - Native timezone support with Temporal API primitives
- **🎯 Data-agnostic** - Works with any data type through accessor pattern
- **⚡️ Type-safe** - Full TypeScript support with conditional types based on configured views
- **🪝 React integration** - Optimized hooks with TanStack Store for state management
- **🔧 Zero config** - Sensible defaults, customize only what you need
- **📦 Minimal** - Simple, composable functions with no unnecessary abstractions

**Key features:**
- ✅ Built exclusively on Temporal API (no Date objects, no moment.js, no date-fns)
- ✅ Automatic DST handling and timezone conversions
- ✅ Type-safe view methods (only available methods for configured views)
- ✅ Calendar-aware arithmetic (leap years, month-end dates)
- ✅ Flexible accessor pattern for any data structure
- ✅ Polyfill included for browser compatibility

**Perfect for:**
- Event calendars and schedulers
- Booking systems and appointment managers
- Task management with due dates
- Analytics dashboards with date ranges
- Any app that needs multi-view calendar navigation

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

const events: Event[] = [
  {
    id: '1',
    title: 'Team Meeting',
    start: Temporal.ZonedDateTime.from('2025-01-20T14:00:00-05:00[America/New_York]')
  }
];

const accessor = createCalendarAccessor<Event>({
  getDate: (event) => event.start.toPlainDate(),
  getStart: (event) => event.start,
});

function MyCalendar() {
  const calendar = useCalendar({
    data: events,
    views: createCalendarViews<Event>()({
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
import { buildMonth, createCalendarAccessor, getWeekdays, getMonthName } from '@gobrand/calendar-core';
import { Temporal } from '@js-temporal/polyfill';

type Event = {
  id: string;
  date: Temporal.PlainDate;
  title: string;
};

const events: Event[] = [
  { id: '1', date: Temporal.PlainDate.from('2025-01-20'), title: 'Team Meeting' },
  { id: '2', date: Temporal.PlainDate.from('2025-01-22'), title: 'Code Review' },
];

const accessor = createCalendarAccessor<Event>({
  getDate: (event) => event.date,
});

const month = buildMonth(2025, 1, {
  weekStartsOn: 1,
  data: events,
  accessor,
});

console.log(getMonthName(month.month)); // "January"
console.log(getWeekdays(1)); // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

month.weeks.forEach(week => {
  week.forEach(day => {
    console.log(
      day.date.toString(),
      day.isCurrentMonth,
      day.isToday,
      `${day.items.length} events`
    );
  });
});
```

## API

### React Hooks

#### `useCalendar(options)`

Create a calendar instance with reactive state management. Returns a Calendar object with type-safe methods based on configured views.

**Parameters:**
- `options` (CalendarOptions): Configuration object
  - `data` (TItem[]): Array of items to display in the calendar
  - `views` (CalendarViewOptions): View configurations (month, week, day)
  - `timeZone` (string, optional): IANA timezone identifier (defaults to system timezone)
  - `state` (Partial<CalendarState>, optional): Initial state override
  - `onStateChange` (function, optional): Callback when state changes

**Returns:** `Calendar<TItem, TOptions>` - Calendar instance with conditional methods

**Example:**
```tsx
import { useCalendar, createCalendarViews, createCalendarAccessor } from '@gobrand/react-calendar';

type Event = {
  id: string;
  title: string;
  start: Temporal.ZonedDateTime;
  end?: Temporal.ZonedDateTime;
};

const accessor = createCalendarAccessor<Event>({
  getDate: (event) => event.start.toPlainDate(),
  getStart: (event) => event.start,
  getEnd: (event) => event.end,
});

const calendar = useCalendar({
  data: events,
  timeZone: 'America/New_York',
  views: createCalendarViews<Event>()({
    month: { weekStartsOn: 1, accessor },
    week: { weekStartsOn: 1, startHour: 8, endHour: 18, accessor },
    day: { startHour: 8, endHour: 18, slotDuration: 30, accessor },
  }),
});

// Type-safe methods - only available if view is configured
calendar.getMonth();  // ✓ Available (month view configured)
calendar.getWeek();   // ✓ Available (week view configured)
calendar.getDay();    // ✓ Available (day view configured)
```

### Core Calendar Methods

#### View Methods

##### `getMonth()`

Get the current month view. Only available if month view is configured.

**Returns:** `CalendarMonth<TItem>` - Month grid with weeks and days
- `weeks` - Array of weeks, each containing 7 days
- `month` - Temporal.PlainYearMonth for the current month

**Example:**
```tsx
const month = calendar.getMonth();

month.weeks.forEach(week => {
  week.forEach(day => {
    console.log(day.date, day.items, day.isToday, day.isCurrentMonth);
  });
});
```

##### `getWeek()`

Get the current week view. Only available if week view is configured.

**Returns:** `CalendarWeekView<TItem>` - Week with days and optional time slots
- `days` - Array of 7 days in the week
- `weekStart` - Temporal.PlainDate for the first day
- `weekEnd` - Temporal.PlainDate for the last day

**Example:**
```tsx
const week = calendar.getWeek();

week.days.forEach(day => {
  console.log(day.date, day.items);
  day.timeSlots?.forEach(slot => {
    console.log(slot.hour, slot.minute, slot.items);
  });
});
```

##### `getDay()`

Get the current day view. Only available if day view is configured.

**Returns:** `CalendarDayView<TItem>` - Day with time slots
- `date` - Temporal.PlainDate for the day
- `isToday` - Boolean indicating if this is today
- `timeSlots` - Array of time slots with items
- `items` - All items for this day

**Example:**
```tsx
const day = calendar.getDay();

console.log(day.date, day.isToday);
day.timeSlots.forEach(slot => {
  console.log(`${slot.hour}:${slot.minute}`, slot.items);
});
```

#### Navigation Methods

##### Month Navigation

```tsx
calendar.nextMonth();           // Go to next month
calendar.previousMonth();       // Go to previous month
calendar.goToMonth(2025, 6);    // Go to specific month (year, month)
```

##### Week Navigation

```tsx
calendar.nextWeek();       // Go to next week
calendar.previousWeek();   // Go to previous week
```

##### Day Navigation

```tsx
calendar.nextDay();        // Go to next day
calendar.previousDay();    // Go to previous day
```

##### Universal Navigation

```tsx
calendar.goToToday();      // Go to today (works for all views)
```

#### View Management

##### `setCurrentView(view)`

Switch between configured views.

**Parameters:**
- `view` (string): One of the configured view names ('month' | 'week' | 'day')

**Example:**
```tsx
calendar.setCurrentView('week');  // Switch to week view
calendar.setCurrentView('month'); // Switch to month view
```

##### `getTitle(view?, locales?, options?)`

Get a formatted title for the current view or a specific view.

**Parameters:**
- `view` (string, optional): View name (defaults to current view)
- `locales` (string | string[], optional): Locale(s) for formatting
- `options` (Intl.DateTimeFormatOptions, optional): Formatting options

**Returns:** `string` - Formatted title

**Example:**
```tsx
calendar.getTitle('month');                    // "January 2025"
calendar.getTitle('month', 'es-ES');           // "enero de 2025"
calendar.getTitle('week');                     // "Jan 20 – 26, 2025"
calendar.getTitle('day', 'en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}); // "Monday, January 20, 2025"
```

#### State Management

##### `getState()`

Get the current calendar state.

**Returns:** `CalendarState` - Current state object
- `currentView` - Active view name
- `referenceDate` - Current reference date (PlainDate)

##### `setState(updater)`

Update the calendar state.

**Parameters:**
- `updater` (function | object): State update function or partial state object

**Example:**
```tsx
// Function updater
calendar.setState(state => ({
  ...state,
  referenceDate: Temporal.PlainDate.from('2025-12-25')
}));

// Object updater
calendar.setState({ currentView: 'week' });
```

### Accessor Pattern

#### `createCalendarAccessor(accessor)`

Create a type-safe accessor for mapping your data to calendar dates. This is a type-identity function for TypeScript inference.

**Parameters:**
- `accessor` (CalendarAccessor<TItem>): Accessor configuration
  - `getDate` (required): Extract PlainDate from item
  - `getStart` (optional): Extract ZonedDateTime start time
  - `getEnd` (optional): Extract ZonedDateTime end time

**Returns:** Same accessor object with proper types

**Example:**
```tsx
// Simple date-based items (tasks, posts)
type Task = {
  id: string;
  name: string;
  dueDate: Temporal.PlainDate;
};

const taskAccessor = createCalendarAccessor<Task>({
  getDate: (task) => task.dueDate,
});

// Time-based items with start time (events, appointments)
type Event = {
  id: string;
  title: string;
  start: Temporal.ZonedDateTime;
};

const eventAccessor = createCalendarAccessor<Event>({
  getDate: (event) => event.start.toPlainDate(),
  getStart: (event) => event.start,
});

// Items with start and end times (meetings, bookings)
type Meeting = {
  id: string;
  title: string;
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
};

const meetingAccessor = createCalendarAccessor<Meeting>({
  getDate: (meeting) => meeting.start.toPlainDate(),
  getStart: (meeting) => meeting.start,
  getEnd: (meeting) => meeting.end,
});
```

### View Configuration

#### `createCalendarViews()`

Create type-safe view configurations. This is a curried function that requires a type parameter.

**Usage:**
```tsx
const views = createCalendarViews<TItem>()({
  month?: { ... },
  week?: { ... },
  day?: { ... }
});
```

#### Month View Options

```tsx
type MonthViewOptions<TItem> = {
  accessor: CalendarAccessor<TItem>;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
};
```

#### Week View Options

```tsx
type WeekViewOptions<TItem> = {
  accessor: CalendarAccessor<TItem>;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startHour?: number;      // Default: 0
  endHour?: number;        // Default: 24
  slotDuration?: number;   // Minutes per slot, default: 60
};
```

#### Day View Options

```tsx
type DayViewOptions<TItem> = {
  accessor: CalendarAccessor<TItem>;
  startHour?: number;      // Default: 0
  endHour?: number;        // Default: 24
  slotDuration?: number;   // Minutes per slot, default: 60
};
```

### Building Calendars (Core)

Low-level functions for building calendar grids without state management.

#### `buildMonth(year, month, options?)`

Build a month grid for any year and month.

**Parameters:**
- `year` (number): Year (e.g., 2025)
- `month` (number): Month (1-12)
- `options` (object, optional):
  - `weekStartsOn` (0-6): First day of week
  - `today` (PlainDate): Override today's date
  - `data` (TItem[]): Items to include
  - `accessor` (CalendarAccessor<TItem>): Data accessor

**Returns:** `CalendarMonth<TItem>`

**Example:**
```typescript
import { buildMonth, createCalendarAccessor } from '@gobrand/calendar-core';

const month = buildMonth(2025, 1, {
  weekStartsOn: 1,
  data: events,
  accessor: createCalendarAccessor({
    getDate: (event) => event.date
  })
});
```

#### `buildWeek(date, options?)`

Build a week view for a specific date.

**Parameters:**
- `date` (PlainDate): Any date in the target week
- `options` (object, optional):
  - `weekStartsOn` (0-6): First day of week
  - `startHour` (number): Start hour for time slots
  - `endHour` (number): End hour for time slots
  - `slotDuration` (number): Minutes per slot
  - `today` (PlainDate): Override today's date
  - `data` (TItem[]): Items to include
  - `accessor` (CalendarAccessor<TItem>): Data accessor

**Returns:** `CalendarWeekView<TItem>`

#### `buildDay(date, options?)`

Build a day view with time slots.

**Parameters:**
- `date` (PlainDate): The target date
- `options` (object, optional):
  - `startHour` (number): Start hour for time slots
  - `endHour` (number): End hour for time slots
  - `slotDuration` (number): Minutes per slot
  - `today` (PlainDate): Override today's date
  - `data` (TItem[]): Items to include
  - `accessor` (CalendarAccessor<TItem>): Data accessor

**Returns:** `CalendarDayView<TItem>`

### Formatting Utilities

#### `getWeekdays(weekStartsOn?, locale?, format?)`

Get localized weekday names.

**Parameters:**
- `weekStartsOn` (0-6, optional): First day of week (default: 0 = Sunday)
- `locale` (string, optional): BCP 47 locale (default: system locale)
- `format` ('long' | 'short' | 'narrow', optional): Name format (default: 'short')

**Returns:** `string[]` - Array of 7 weekday names

**Example:**
```typescript
import { getWeekdays } from '@gobrand/calendar-core';

getWeekdays(1);                    // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
getWeekdays(0);                    // ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
getWeekdays(1, 'es-ES');           // ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"]
getWeekdays(1, 'en-US', 'long');   // ["Monday", "Tuesday", ...]
getWeekdays(1, 'en-US', 'narrow'); // ["M", "T", "W", "T", "F", "S", "S"]
```

#### `getMonthName(month, locale?)`

Get localized month name.

**Parameters:**
- `month` (PlainYearMonth): The month to format
- `locale` (string, optional): BCP 47 locale

**Returns:** `string` - Formatted month name

**Example:**
```typescript
import { getMonthName } from '@gobrand/calendar-core';
import { Temporal } from '@js-temporal/polyfill';

const month = Temporal.PlainYearMonth.from('2025-01');
getMonthName(month);          // "January"
getMonthName(month, 'es-ES'); // "enero"
getMonthName(month, 'ja-JP'); // "1月"
```

#### `formatTime(time, locale?)`

Format a PlainTime as a localized time string.

**Parameters:**
- `time` (PlainTime): Time to format
- `locale` (string, optional): BCP 47 locale

**Returns:** `string` - Formatted time

**Example:**
```typescript
import { formatTime } from '@gobrand/calendar-core';
import { Temporal } from '@js-temporal/polyfill';

const time = Temporal.PlainTime.from('14:30');
formatTime(time);          // "2:30 PM" (en-US)
formatTime(time, 'en-GB'); // "14:30"
formatTime(time, 'es-ES'); // "14:30"
```

### Timezone Utilities

#### `getMonthRange(timeZone?, weekStartsOn?)`

Get the date range for the current month, week-aligned in a specific timezone.

**Parameters:**
- `timeZone` (string, optional): IANA timezone (default: system timezone)
- `weekStartsOn` (0-6, optional): First day of week (default: 0)

**Returns:** `DateRange` - Start/end ZonedDateTime for the month

**Example:**
```typescript
import { getMonthRange } from '@gobrand/calendar-core';

const range = getMonthRange('America/New_York', 1);
// Returns week-aligned range for current month in New York time
console.log(range.start, range.end);
```

#### `getWeekRange(timeZone?, weekStartsOn?)`

Get the date range for the current week in a specific timezone.

**Parameters:**
- `timeZone` (string, optional): IANA timezone (default: system timezone)
- `weekStartsOn` (0-6, optional): First day of week (default: 0)

**Returns:** `DateRange` - Start/end ZonedDateTime for the week

#### `getDayRange(timeZone?)`

Get the date range for today in a specific timezone.

**Parameters:**
- `timeZone` (string, optional): IANA timezone (default: system timezone)

**Returns:** `DateRange` - Start/end ZonedDateTime for today

#### `getCurrentTimeZone()`

Get the system's current IANA timezone identifier.

**Returns:** `string` - IANA timezone (e.g., "America/New_York")

#### `convertToTimezone(zdt, timeZone)`

Convert a ZonedDateTime to a different timezone.

**Parameters:**
- `zdt` (ZonedDateTime): Source ZonedDateTime
- `timeZone` (string): Target IANA timezone

**Returns:** `ZonedDateTime` - Same instant in new timezone

#### `createZonedDateTime(date, time, timeZone)`

Create a ZonedDateTime from a PlainDate and PlainTime.

**Parameters:**
- `date` (PlainDate): The date
- `time` (PlainTime): The time
- `timeZone` (string): IANA timezone

**Returns:** `ZonedDateTime`

## Real World Examples

### Example 1: Event Calendar with Multi-View Support

A complete event calendar with month, week, and day views, timezone support, and type-safe view switching.

```tsx
import {
  useCalendar,
  createCalendarViews,
  createCalendarAccessor,
  getWeekdays
} from '@gobrand/react-calendar';
import { Temporal } from '@js-temporal/polyfill';

type Event = {
  id: string;
  title: string;
  description?: string;
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
};

const events: Event[] = [
  {
    id: '1',
    title: 'Team Standup',
    start: Temporal.ZonedDateTime.from('2025-01-20T09:00:00-05:00[America/New_York]'),
    end: Temporal.ZonedDateTime.from('2025-01-20T09:30:00-05:00[America/New_York]')
  },
  {
    id: '2',
    title: 'Client Meeting',
    start: Temporal.ZonedDateTime.from('2025-01-20T14:00:00-05:00[America/New_York]'),
    end: Temporal.ZonedDateTime.from('2025-01-20T15:00:00-05:00[America/New_York]')
  }
];

const accessor = createCalendarAccessor<Event>({
  getDate: (event) => event.start.toPlainDate(),
  getStart: (event) => event.start,
  getEnd: (event) => event.end,
});

function EventCalendar() {
  const calendar = useCalendar({
    data: events,
    timeZone: 'America/New_York',
    views: createCalendarViews<Event>()({
      month: { weekStartsOn: 0, accessor },
      week: { weekStartsOn: 0, startHour: 8, endHour: 18, slotDuration: 30, accessor },
      day: { startHour: 8, endHour: 18, slotDuration: 30, accessor },
    }),
  });

  const currentView = calendar.getState().currentView;

  return (
    <div className="calendar">
      {/* Header with view switcher */}
      <header>
        <div className="view-buttons">
          <button
            onClick={() => calendar.setCurrentView('month')}
            className={currentView === 'month' ? 'active' : ''}
          >
            Month
          </button>
          <button
            onClick={() => calendar.setCurrentView('week')}
            className={currentView === 'week' ? 'active' : ''}
          >
            Week
          </button>
          <button
            onClick={() => calendar.setCurrentView('day')}
            className={currentView === 'day' ? 'active' : ''}
          >
            Day
          </button>
        </div>

        <h2>{calendar.getTitle()}</h2>

        <div className="nav-buttons">
          {currentView === 'month' && (
            <>
              <button onClick={calendar.previousMonth}>←</button>
              <button onClick={calendar.goToToday}>Today</button>
              <button onClick={calendar.nextMonth}>→</button>
            </>
          )}
          {currentView === 'week' && (
            <>
              <button onClick={calendar.previousWeek}>←</button>
              <button onClick={calendar.goToToday}>Today</button>
              <button onClick={calendar.nextWeek}>→</button>
            </>
          )}
          {currentView === 'day' && (
            <>
              <button onClick={calendar.previousDay}>←</button>
              <button onClick={calendar.goToToday}>Today</button>
              <button onClick={calendar.nextDay}>→</button>
            </>
          )}
        </div>
      </header>

      {/* Month View */}
      {currentView === 'month' && (
        <div className="month-view">
          <div className="weekday-headers">
            {getWeekdays(0).map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          <div className="month-grid">
            {calendar.getMonth().weeks.flat().map(day => (
              <div
                key={day.date.toString()}
                className={`day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}`}
              >
                <div className="day-number">{day.date.day}</div>
                <div className="events">
                  {day.items.map(event => (
                    <div key={event.id} className="event">
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week View */}
      {currentView === 'week' && (
        <div className="week-view">
          <div className="weekday-headers">
            {calendar.getWeek().days.map(day => (
              <div key={day.date.toString()} className="weekday">
                <div>{day.date.toLocaleString('en-US', { weekday: 'short' })}</div>
                <div className={day.isToday ? 'today' : ''}>{day.date.day}</div>
              </div>
            ))}
          </div>
          <div className="week-grid">
            {calendar.getWeek().days.map(day => (
              <div key={day.date.toString()} className="day-column">
                {day.timeSlots?.map((slot, i) => (
                  <div key={i} className="time-slot">
                    {slot.items.map(event => (
                      <div key={event.id} className="event">
                        {event.title}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day View */}
      {currentView === 'day' && (
        <div className="day-view">
          {calendar.getDay().timeSlots.map((slot, i) => (
            <div key={i} className="time-slot">
              <div className="time">{slot.hour}:{String(slot.minute).padStart(2, '0')}</div>
              <div className="slot-events">
                {slot.items.map(event => (
                  <div key={event.id} className="event">
                    <strong>{event.title}</strong>
                    {event.description && <p>{event.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example 2: Task Due Date Calendar

Simple calendar showing task due dates without time information.

```tsx
import { useCalendar, createCalendarViews, createCalendarAccessor } from '@gobrand/react-calendar';
import { Temporal } from '@js-temporal/polyfill';

type Task = {
  id: string;
  title: string;
  dueDate: Temporal.PlainDate;
  completed: boolean;
};

const tasks: Task[] = [
  { id: '1', title: 'Review PR #42', dueDate: Temporal.PlainDate.from('2025-01-20'), completed: false },
  { id: '2', title: 'Write documentation', dueDate: Temporal.PlainDate.from('2025-01-22'), completed: false },
  { id: '3', title: 'Deploy to production', dueDate: Temporal.PlainDate.from('2025-01-25'), completed: true },
];

function TaskCalendar() {
  const calendar = useCalendar({
    data: tasks,
    views: createCalendarViews<Task>()({
      month: {
        weekStartsOn: 1,
        accessor: createCalendarAccessor({
          getDate: (task) => task.dueDate,
        })
      },
    }),
  });

  const month = calendar.getMonth();

  return (
    <div>
      <header>
        <button onClick={calendar.previousMonth}>Previous</button>
        <h2>{calendar.getTitle('month')}</h2>
        <button onClick={calendar.nextMonth}>Next</button>
      </header>

      <div className="calendar-grid">
        {month.weeks.flat().map(day => (
          <div
            key={day.date.toString()}
            className={!day.isCurrentMonth ? 'dimmed' : ''}
          >
            <div>{day.date.day}</div>
            {day.items.map(task => (
              <div
                key={task.id}
                className={task.completed ? 'completed' : 'pending'}
              >
                {task.title}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Vanilla JavaScript Calendar Builder

Using core functions without React for maximum flexibility.

```typescript
import {
  buildMonth,
  createCalendarAccessor,
  getWeekdays,
  getMonthName
} from '@gobrand/calendar-core';
import { Temporal } from '@js-temporal/polyfill';

type BlogPost = {
  id: string;
  title: string;
  publishedAt: Temporal.PlainDate;
};

const posts: BlogPost[] = [
  { id: '1', title: 'Getting Started with Temporal', publishedAt: Temporal.PlainDate.from('2025-01-15') },
  { id: '2', title: 'Building Calendars', publishedAt: Temporal.PlainDate.from('2025-01-20') },
];

const accessor = createCalendarAccessor<BlogPost>({
  getDate: (post) => post.publishedAt,
});

// Build January 2025 calendar
const month = buildMonth(2025, 1, {
  weekStartsOn: 1,
  data: posts,
  accessor,
});

// Render to HTML
const weekdays = getWeekdays(1);
const monthName = getMonthName(month.month);

let html = `<h2>${monthName} ${month.month.year}</h2>`;
html += '<table><thead><tr>';
weekdays.forEach(day => {
  html += `<th>${day}</th>`;
});
html += '</tr></thead><tbody>';

month.weeks.forEach(week => {
  html += '<tr>';
  week.forEach(day => {
    const className = day.isCurrentMonth ? '' : 'other-month';
    html += `<td class="${className}">`;
    html += `<div>${day.date.day}</div>`;
    day.items.forEach(post => {
      html += `<div class="post">${post.title}</div>`;
    });
    html += '</td>';
  });
  html += '</tr>';
});

html += '</tbody></table>';
document.getElementById('calendar')!.innerHTML = html;
```

## Browser Support

The Temporal API is a Stage 3 TC39 proposal. The polyfill `@js-temporal/polyfill` is included as a dependency for both packages, ensuring compatibility across all modern browsers.

```typescript
import { Temporal } from '@js-temporal/polyfill';
```

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

# Release new version
pnpm release <patch|minor|major>
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Built by Go Brand

temporal-calendar is built and maintained by [Go Brand](https://gobrand.app) - a modern social media management platform.
