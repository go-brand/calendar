---
name: calendar
description: Use when building calendar UIs with the Temporal API. Provides month, week, and day views with timezone awareness, DST-safe operations, and React hooks for state management.
---

# temporal-calendar - Calendar Building Blocks

Lightweight utility library for building calendar UIs with the Temporal API.

```bash
# Core (framework-agnostic)
npm install @gobrand/calendar-core @js-temporal/polyfill

# React
npm install @gobrand/react-calendar @js-temporal/polyfill
```

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
  { id: 'launch', title: 'Launch', date: Temporal.Now.plainDateISO() },
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
| [Installation](https://calendar.gobrand.app/docs/installation) | Get started with GoBrand React Calendar |
| [Your first calendar](https://calendar.gobrand.app/docs/first-calendar) | Build a navigable month with one hook. |
| [Data and Suspense](https://calendar.gobrand.app/docs/data-and-suspense) | Keep calendar controls available while a view loads its events. |
| [Timezones and visible ranges](https://calendar.gobrand.app/docs/timezones-and-ranges) | Query half-open calendar ranges that remain correct across DST transitions. |
| [Controlled state and routing](https://calendar.gobrand.app/docs/controlled-state) | Synchronize calendar date and view with URLs or external application state. |
| [useCreateCalendar](https://calendar.gobrand.app/docs/api/use-create-calendar) | Create a controlled or uncontrolled item-agnostic controller, with optional simple-mode data. |
| [useCalendar](https://calendar.gobrand.app/docs/api/use-calendar) | Read the item-agnostic calendar controller from context. |
| [useCalendarView](https://calendar.gobrand.app/docs/api/use-calendar-view) | Put events into one view from a shared calendar controller. |
| [CalendarProvider](https://calendar.gobrand.app/docs/api/calendar-provider) | Share one calendar controller with child components. |
| [Calendar Controller](https://calendar.gobrand.app/docs/types/calendar) | Item-agnostic calendar state, navigation, and visible query range. |
| [View Models](https://calendar.gobrand.app/docs/types/views) | Discriminated month, week, and day models with locally inferred items. |
| [Range and Configuration Types](https://calendar.gobrand.app/docs/types/helpers) | Public types for configured views, geometry, and half-open query ranges. |
| [Month View](https://calendar.gobrand.app/docs/examples/basic-month) | A complete month with navigation and events. |
| [Date Picker](https://calendar.gobrand.app/docs/examples/date-picker) | Select a date in a month without event data or accessors. |
| [Week View](https://calendar.gobrand.app/docs/examples/week-view) | Build a simple week or add explicit time slots. |
| [Day View](https://calendar.gobrand.app/docs/examples/day-view) | A day timeline with explicit Temporal time slots. |
| [Multi-View Calendar](https://calendar.gobrand.app/docs/examples/multi-view) | One calendar that switches between month, week, and day. |
| [Suspense Query](https://calendar.gobrand.app/docs/examples/suspense-query) | Keep month navigation available while its events load. |

## Core

| Documentation topic | Description |
|----------|-------------|
| [Installation](https://calendar.gobrand.app/docs/core/installation) | Get started with GoBrand Calendar Core |
| [createCalendar](https://calendar.gobrand.app/docs/core/create-calendar) | Create an item-agnostic controller from a non-empty view configuration. |
| [View Projections](https://calendar.gobrand.app/docs/core/projections) | Build month, week, and day models from controller state and local data. |
| [Visible ranges](https://calendar.gobrand.app/docs/core/visible-ranges) | Understand Calendar's timezone-aware, half-open query boundary. |
| [Utilities](https://calendar.gobrand.app/docs/core/utilities) | Weekday labels and direct Temporal recipes for formatting, navigation, and timezone conversion. |

## Key Types

- `CalendarController<TViews>` contains the current date and view, typed `viewNames`, resolved view configuration, visible range, title, navigation methods, setters, and `subscribe`.
- `VisibleRange` contains `start` and `end` as `Temporal.ZonedDateTime` values in the controller timezone.
- `MonthView<TItem>`, `WeekView<TItem>`, and `DayView<TItem>` are discriminated by their `name` field.
- `NonEmptyCalendarViews` requires at least one of `month`, `week`, or `day`.

## Inference rules

- `useCreateCalendar` with `items` and `getDate` returns the controller plus `activeView`; without items it returns the item-agnostic controller.
- A single configured view narrows `activeView` to that view; multiple views produce only the configured discriminated union.
- `useCalendar()` accepts no item generic. Infer items in each literal `useCalendarView({ view, items, getDate })` call.

## View configuration

- Use `month: true`, `week: true`, or `day: true` for default geometry.
- Supply an object only for custom week/day geometry such as `dayStart`, `dayEnd`, or `slotDuration`.
- Omit a key to make that view unavailable. `false` is intentionally rejected so key presence always means configured.

## Controller lifetime and event mapping

Controller and action identities can change across renders. Subscribe in an effect with `[calendar]` and return the unsubscribe function.
The controller timezone sets calendar geometry; event accessors own conversion. Derive getDate and getStart from the same normalized ZonedDateTime.
[Timezone conversion recipe](https://calendar.gobrand.app/docs/timezones-and-ranges). [Controller lifetime](https://calendar.gobrand.app/docs/controlled-state).

## Initialization and timezone

- `timeZone` accepts an IANA timezone string and defaults to `Temporal.Now.timeZoneId()`. The visible range, `today()`, and `isToday` all use that zone.
- Use `defaultDate` and `defaultView` for uncontrolled initial state. The date defaults to today in the calendar timezone; the view defaults to the first configured view.
- Use `date` with `onDateChange`, or `view` with `onViewChange`, for controlled state. A controlled view must be configured in `views`.
- Core `createCalendar` uses `date` and `view` directly, with `defaultView` as its uncontrolled-style initial-view alias.
