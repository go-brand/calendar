---
name: calendar
description: Use when building a month, week, or day calendar, a date picker, or a scheduling view in React or TypeScript with @gobrand/react-calendar or @gobrand/calendar-core. Covers events on the right day across timezones, time slots, navigation, URL state, and querying the visible range.
---

# GoBrand Calendar

Headless month, week, and day calendars built on Temporal. You render the markup; Calendar keeps the date and view, navigates, builds each grid, and places your events.

```bash
# React
pnpm add @gobrand/react-calendar @js-temporal/polyfill

# Anything else
pnpm add @gobrand/calendar-core @js-temporal/polyfill
```

## Rules

- `getDate` returns the `Temporal.PlainDate` an event is on. For a timed event, convert it to the calendar timezone first: `event.start.withTimeZone(timeZone).toPlainDate()`.
- `getStart` returns a `Temporal.ZonedDateTime` in the calendar timezone. Derive it from the same value as `getDate`.
- The calendar timezone does not convert events. Set `timeZone` explicitly for server rendering or for anyone else's calendar.
- Query with `visibleRange`: `>= start` and `< end`.
- `weekStartsOn` is `1` (Monday) through `7` (Sunday), not `0` for Sunday.
- Enable a view with `true`; leave it out to disable it. Week and day take `dayStart`, `dayEnd` (`Temporal.PlainTime`) and `slotDuration` (`Temporal.Duration`).
- Wrong Temporal types throw a `TypeError` that names the type received. Convert, do not cast.
- Use the calendar from the current render; subscribe in an effect that depends on `[calendar]`.

## Quick start

```tsx
import { Temporal } from '@js-temporal/polyfill'
import { useCreateCalendar } from '@gobrand/react-calendar'

type Event = {
  id: string
  title: string
  date: Temporal.PlainDate
}

const events: Event[] = [
  { id: 'launch', title: 'Product launch', date: Temporal.PlainDate.from('2026-07-10') },
]

function Calendar() {
  const calendar = useCreateCalendar({
    views: { month: true },
    items: events,
    getDate: event => event.date,
  })
  const month = calendar.activeView

  return (
    <section>
      <button onClick={calendar.previous}>Previous</button>
      <button onClick={calendar.today}>Today</button>
      <button onClick={calendar.next}>Next</button>
      <h2>{calendar.title()}</h2>

      {month.weeks.flat().map(day => (
        <div key={day.id}>
          {day.date.toString()}: {day.items.map(event => event.title).join(', ')}
        </div>
      ))}
    </section>
  )
}
```

## Using Suspense

When each view fetches its own data, keep the controller above the Suspense boundary and call `useCalendarView` after the data is ready.

[See the complete Suspense example](https://calendar.gobrand.app/docs/data-and-suspense).

## React

| Documentation topic | Description |
|----------|-------------|
| [Installation](https://calendar.gobrand.app/docs/installation) | Install GoBrand React Calendar. |
| [Your first calendar](https://calendar.gobrand.app/docs/first-calendar) | Build a month calendar with navigation in one hook. |
| [Data and Suspense](https://calendar.gobrand.app/docs/data-and-suspense) | Keep calendar controls available while a view loads its events. |
| [Timezones and visible ranges](https://calendar.gobrand.app/docs/timezones-and-ranges) | Show the right day in every timezone and query exactly what is on screen. |
| [Controlled state and routing](https://calendar.gobrand.app/docs/controlled-state) | Keep the calendar's date and view in the URL or your own state. |
| [useCreateCalendar](https://calendar.gobrand.app/docs/api/use-create-calendar) | Create a calendar in a component, with or without its events. |
| [useCalendar](https://calendar.gobrand.app/docs/api/use-calendar) | Read the calendar from CalendarProvider. |
| [useCalendarView](https://calendar.gobrand.app/docs/api/use-calendar-view) | Put events into one view of a shared calendar. |
| [CalendarProvider](https://calendar.gobrand.app/docs/api/calendar-provider) | Share one calendar with the components below it. |
| [Types](https://calendar.gobrand.app/docs/types) | The shapes you render, from the calendar to its days and time slots. |
| [Month View](https://calendar.gobrand.app/docs/examples/basic-month) | A month with navigation and events. |
| [Date Picker](https://calendar.gobrand.app/docs/examples/date-picker) | Pick a date from a month, with no event data. |
| [Week View](https://calendar.gobrand.app/docs/examples/week-view) | A week of events, with or without time slots. |
| [Day View](https://calendar.gobrand.app/docs/examples/day-view) | One day with hourly time slots. |
| [Multi-View Calendar](https://calendar.gobrand.app/docs/examples/multi-view) | One calendar that switches between month, week, and day. |
| [Suspense Query](https://calendar.gobrand.app/docs/examples/suspense-query) | Keep month navigation usable while its events load. |

## Core

| Documentation topic | Description |
|----------|-------------|
| [Installation](https://calendar.gobrand.app/docs/core/installation) | Install GoBrand Calendar Core. |
| [createCalendar](https://calendar.gobrand.app/docs/core/create-calendar) | Create a calendar with its date, view, timezone, and navigation. |
| [View Projections](https://calendar.gobrand.app/docs/core/projections) | Turn the calendar and your data into month, week, or day views. |
| [Visible ranges](https://calendar.gobrand.app/docs/core/visible-ranges) | The start and end to query for the dates on screen. |
| [Utilities](https://calendar.gobrand.app/docs/core/utilities) | Weekday labels for calendar headers, and the Temporal one-liners for everything else. |

## Types

- With `items`, `useCreateCalendar` also returns `activeView`. One configured view narrows it to that view; several give a union discriminated by `name`.
- `useCalendar()` takes no event type. Infer events in each `useCalendarView({ view, items, getDate })` call.
- `VisibleRange` is `{ start, end }`, both `Temporal.ZonedDateTime` in the calendar timezone.
