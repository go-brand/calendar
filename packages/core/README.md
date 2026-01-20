# @gobrand/calendar-core

[![npm version](https://img.shields.io/npm/v/@gobrand/calendar-core.svg)](https://www.npmjs.com/package/@gobrand/calendar-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Framework-agnostic calendar utilities built with the [Temporal API](https://tc39.es/proposal-temporal/docs/). Simple, composable functions for building month, week, and day views with full timezone support.

> **For React users:** Check out [@gobrand/react-calendar](https://www.npmjs.com/package/@gobrand/react-calendar) for a ready-to-use hook with state management built on top of this core library.

## Installation

```bash
npm install @gobrand/calendar-core
# or
pnpm add @gobrand/calendar-core
```

## Why @gobrand/calendar-core?

Building calendars is complex: timezone handling, DST transitions, date arithmetic, and data mapping. **@gobrand/calendar-core** provides pure, framework-agnostic functions for calendar logic:

- **🌍 Timezone-aware** - Native timezone support with Temporal API primitives
- **🎯 Data-agnostic** - Works with any data type through accessor pattern
- **⚡️ Type-safe** - Full TypeScript support with proper Temporal types
- **📦 Minimal** - Simple, composable functions with no unnecessary abstractions
- **🔧 Zero config** - Sensible defaults, customize only what you need
- **🪄 Framework-agnostic** - Use with React, Vue, Angular, Svelte, or vanilla JavaScript

**Key features:**
- ✅ Built exclusively on Temporal API (no Date objects, no moment.js, no date-fns)
- ✅ Automatic DST handling and timezone conversions
- ✅ Calendar-aware arithmetic (leap years, month-end dates)
- ✅ Flexible accessor pattern for any data structure
- ✅ Polyfill included for browser compatibility

**Perfect for:**
- Building custom calendar UIs in any framework
- Server-side calendar generation
- Event calendars and schedulers
- Booking systems and appointment managers
- Task management with due dates
- Analytics dashboards with date ranges

## Quick Start

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

### Building Calendars

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
- `weekStartsOn` (0-6, optional): First day of week (default: 1)

**Returns:** `{ start: Temporal.PlainDate; end: Temporal.PlainDate }` - Start/end dates for the week-aligned month

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
- `weekStartsOn` (0-6, optional): First day of week (default: 1)

**Returns:** `{ start: Temporal.PlainDate; end: Temporal.PlainDate }` - Start/end dates for the week

#### `getDayRange(timeZone?)`

Get the date range for today in a specific timezone.

**Parameters:**
- `timeZone` (string, optional): IANA timezone (default: system timezone)

**Returns:** `{ start: Temporal.PlainDate; end: Temporal.PlainDate }` - Start/end dates for today (same date)

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

### Example 1: HTML Calendar Generator

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

The Temporal API is a Stage 3 TC39 proposal. The polyfill `@js-temporal/polyfill` is included as a dependency, ensuring compatibility across all modern browsers and Node.js environments.

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
