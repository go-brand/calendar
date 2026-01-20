# @gobrand/react-calendar

[![npm version](https://img.shields.io/npm/v/@gobrand/react-calendar.svg)](https://www.npmjs.com/package/@gobrand/react-calendar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

React hook for building powerful calendar views with the [Temporal API](https://tc39.es/proposal-temporal/docs/). Built on [@gobrand/calendar-core](https://www.npmjs.com/package/@gobrand/calendar-core) with optimized state management using TanStack Store.

## Installation

```bash
npm install @gobrand/react-calendar
# or
pnpm add @gobrand/react-calendar
```

**Peer dependencies:**
- `react ^18.0.0 || ^19.0.0`

## Why @gobrand/react-calendar?

Building React calendar UIs is complex: state management, timezone handling, DST transitions, multi-view navigation, and data mapping. **@gobrand/react-calendar** provides a complete React solution:

- **🪝 Simple React Hook** - Single `useCalendar()` hook with reactive state management
- **📅 Multi-view support** - Month, week, and day views with type-safe view switching
- **🌍 Timezone-aware** - Native timezone support with Temporal API primitives
- **🎯 Data-agnostic** - Works with any data type through accessor pattern
- **⚡️ Type-safe** - Full TypeScript support with conditional types based on configured views
- **⚙️ TanStack Store** - Optimized state management with TanStack Store
- **🔧 Zero config** - Sensible defaults, customize only what you need
- **📦 Minimal** - Built on [@gobrand/calendar-core](https://www.npmjs.com/package/@gobrand/calendar-core) for framework-agnostic logic

**Key features:**
- ✅ Built exclusively on Temporal API (no Date objects, no moment.js, no date-fns)
- ✅ Automatic DST handling and timezone conversions
- ✅ Type-safe view methods (only available methods for configured views)
- ✅ Calendar-aware arithmetic (leap years, month-end dates)
- ✅ Flexible accessor pattern for any data structure
- ✅ Polyfill included for browser compatibility
- ✅ All core utilities re-exported for convenience

**Perfect for:**
- React event calendars and schedulers
- Booking systems and appointment managers
- Task management with due dates
- Analytics dashboards with date ranges
- Any React app that needs calendar navigation

## Quick Start

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
      month: { accessor },
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

> **Note:** For vanilla JavaScript/TypeScript usage, check out [@gobrand/calendar-core](https://www.npmjs.com/package/@gobrand/calendar-core) which provides the underlying framework-agnostic functions.

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
    month: { accessor },
    week: { startHour: 8, endHour: 18, accessor },
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

### Core Utilities (Re-exported)

All utilities from [@gobrand/calendar-core](https://www.npmjs.com/package/@gobrand/calendar-core) are re-exported for convenience. For detailed documentation on these functions, see the [core package documentation](https://www.npmjs.com/package/@gobrand/calendar-core).

**Building Functions:**
- `buildMonth(year, month, options?)` - Build month grid
- `buildWeek(date, options?)` - Build week view
- `buildDay(date, options?)` - Build day view with time slots

**Formatting:**
- `getWeekdays(weekStartsOn?, locale?, format?)` - Localized weekday names
- `getMonthName(month, locale?)` - Localized month name
- `formatTime(time, locale?)` - Format PlainTime

**Timezone:**
- `getMonthRange(timeZone?, weekStartsOn?)` - Week-aligned month range
- `getWeekRange(timeZone?, weekStartsOn?)` - Current week range
- `getDayRange(timeZone?)` - Today in timezone
- `getCurrentTimeZone()` - Get system timezone
- `convertToTimezone(zdt, timeZone)` - Convert between timezones
- `createZonedDateTime(date, time, timeZone)` - Create ZonedDateTime

For detailed documentation and examples, see [@gobrand/calendar-core](https://www.npmjs.com/package/@gobrand/calendar-core).

## Real World Examples

### Example 1: Fetching Calendar Data with useQuery and Date-Range Pagination

This is the most common real-world pattern: fetching data from an API based on the visible calendar date range. As users navigate the calendar (month/week/day), new data is automatically fetched for that time period.

```tsx
import { useQuery } from '@tanstack/react-query';
import { toZonedTime, now } from '@gobrand/tiempo';
import {
  useCalendar,
  createCalendarViews,
  createCalendarAccessor,
  type DateRange,
  getMonthDateRange,
} from '@gobrand/react-calendar';
import { useState } from 'react';

type Post = {
  id: string;
  title: string;
  publishedAt: string; // UTC ISO 8601 string from API
  status: 'draft' | 'scheduled' | 'published';
};

type PostWithDateTime = Post & {
  zonedDateTime: Temporal.ZonedDateTime;
};

const TIME_ZONE = 'America/New_York';

function PostCalendar() {
  // Track the current visible date range
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getMonthDateRange(now(TIME_ZONE).toPlainDate(), TIME_ZONE)
  );

  // Fetch posts for the visible date range
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', dateRange?.start.toString(), dateRange?.end.toString()],
    queryFn: async () => {
      if (!dateRange) return [];

      // Convert date range to UTC ISO strings for API
      const filters = {
        dateRange: {
          start: dateRange.start.toInstant().toString(),
          end: dateRange.end.toInstant().toString(),
        },
      };

      return getPosts(filters);
    },
    // Convert UTC strings to ZonedDateTime for calendar
    select: (posts) =>
      posts.map((post) => ({
        ...post,
        zonedDateTime: toZonedTime(post.publishedAt, TIME_ZONE),
      })),
    enabled: !!dateRange,
  });

  const calendar = useCalendar({
    data: posts,
    timeZone: TIME_ZONE,
    views: createCalendarViews<PostWithDateTime>()({
      month: {
        accessor: createCalendarAccessor({
          getDate: (post) => post.zonedDateTime.toPlainDate(),
          getStart: (post) => post.zonedDateTime,
        }),
      },
    }),
    // Sync date range when calendar navigation changes
    onStateChange: (updater) => {
      const newState =
        typeof updater === 'function' ? updater(calendar.getState()) : updater;
      setDateRange(newState.dateRange);
    },
  });

  const month = calendar.getMonth();

  return (
    <div>
      <header>
        <button onClick={calendar.previousMonth}>←</button>
        <h2>{calendar.getTitle('month')}</h2>
        <button onClick={calendar.nextMonth}>→</button>
        {isLoading && <span>Loading...</span>}
      </header>

      <div className="calendar-grid">
        {month.weeks.flat().map((day) => (
          <div key={day.date.toString()}>
            <div>{day.date.day}</div>
            {day.items.map((post) => (
              <div key={post.id}>{post.title}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Key points:**
- `dateRange` state tracks the currently visible calendar period
- `useQuery` automatically refetches when `dateRange` changes (navigation)
- Date range is converted to UTC ISO strings for the API request
- `select` transforms API responses (UTC ISO strings) to `ZonedDateTime` for the calendar
- `onStateChange` syncs calendar navigation with the date range state
- This pattern works for infinite scroll, cursor-based pagination, or any date-range filtering

### Example 2: Event Calendar with Multi-View Support

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

> **For vanilla JavaScript examples:** Check out [@gobrand/calendar-core documentation](https://www.npmjs.com/package/@gobrand/calendar-core) for framework-agnostic usage examples.

## Browser Support

The Temporal API is a Stage 3 TC39 proposal. The polyfill `@js-temporal/polyfill` is included as a dependency, ensuring compatibility across all modern browsers.

```typescript
import { Temporal } from '@js-temporal/polyfill';
```

**Requirements:**
- React 18+ or React 19+
- Modern browsers with ES2015+ support

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
