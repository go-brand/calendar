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
  { id: 'launch', title: 'Launch', date: Temporal.PlainDate.from('2026-07-14') },
]

const views = ['month', 'week', 'day'] as const

function Calendar() {
  const calendar = useCreateCalendar({
    views: { month: true, week: true, day: true },
    defaultDate: Temporal.PlainDate.from('2026-07-14'),
    items: events,
    getDate: event => event.date,
  })
  const view = calendar.activeView

  return (
    <section>
      <button onClick={calendar.previous}>Previous</button>
      <button onClick={calendar.today}>Today</button>
      <button onClick={calendar.next}>Next</button>

      {views.map(name => (
        <button key={name} onClick={() => calendar.setView(name)}>
          {name}
        </button>
      ))}

      <h2>{calendar.title()}</h2>

      {view.view === 'month' && view.weeks.flat().map(day => (
        <div key={day.id}>
          {day.date.toString()}: {day.items.map(event => event.title).join(', ')}
        </div>
      ))}

      {view.view === 'week' && view.days.map(day => (
        <div key={day.id}>
          {day.date.toString()}: {day.items.map(event => event.title).join(', ')}
        </div>
      ))}

      {view.view === 'day' && (
        <div>
          {view.date.toString()}: {view.items.map(event => event.title).join(', ')}
        </div>
      )}
    </section>
  )
}
```

## Using Suspense

When each view fetches its own data, keep the controller above the Suspense boundary and call `useCalendarView` after the data is ready.

[See the complete Suspense example](https://eng.gobrand.app/calendar/docs/data-and-suspense).

## React

| Function | Description |
|----------|-------------|
| `Installation` | Get started with GoBrand React Calendar |
| `Your first calendar` | Build a navigable month with one hook. |
| `Data and Suspense` | Keep calendar controls available while a view loads its events. |
| `Timezones and visible ranges` | Query half-open calendar ranges that remain correct across DST transitions. |
| `Controlled state and routing` | Synchronize calendar date and view with URLs or external application state. |
| `useCreateCalendar()` | Create a controlled or uncontrolled item-agnostic controller, with optional simple-mode data. |
| `useCalendar()` | Read the item-agnostic calendar controller from context. |
| `useCalendarView()` | Put events into one view from a shared calendar controller. |
| `CalendarProvider` | Share one calendar controller with child components. |
| `Calendar Controller` | Item-agnostic calendar state, navigation, and visible query range. |
| `View Models` | Discriminated month, week, and day models with locally inferred items. |
| `Range and Configuration Types` | Public types for configured views, geometry, and half-open query ranges. |
| `Month View` | A complete month with navigation and events. |
| `Week View` | Build a simple week or add explicit time slots. |
| `Day View` | A day timeline with explicit Temporal time slots. |
| `Multi-View Calendar` | One calendar that switches between month, week, and day. |

## Core

| Function | Description |
|----------|-------------|
| `Installation` | Get started with GoBrand Calendar Core |
| `createCalendar()` | Create an item-agnostic controller from a non-empty view configuration. |
| `View Projections` | Build month, week, and day models from controller state and local data. |
| `Visible ranges` | Understand Calendar's timezone-aware, half-open query boundary. |
| `Utilities` | Formatting, navigation, and timezone helpers |

## Key Types

- `CalendarController<TViews>` contains the current date and view, resolved view configuration, visible range, title, navigation methods, setters, and `subscribe`.
- `VisibleRange` contains `start` and `end` as `Temporal.ZonedDateTime` values in the controller timezone.
- `MonthView<TItem>`, `WeekView<TItem>`, and `DayView<TItem>` are discriminated by their `view` field.
- `NonEmptyCalendarViews` requires at least one of `month`, `week`, or `day`.

## Inference rules

- `useCreateCalendar` with `items` and `getDate` returns the controller plus `activeView`; without items it returns the item-agnostic controller.
- A single configured view narrows `activeView` to that view; multiple views produce only the configured discriminated union.
- `useCalendar()` accepts no item generic. Infer items in each literal `useCalendarView({ view, items, getDate })` call.

## View configuration

- Use `month: true`, `week: true`, or `day: true` for default geometry.
- Supply an object only for custom week/day geometry such as `dayStart`, `dayEnd`, or `slotDuration`.
- Omit a key to make that view unavailable. `false` is intentionally rejected so key presence always means configured.

## Initialization and timezone

- `timeZone` accepts an IANA timezone string and defaults to `Temporal.Now.timeZoneId()`. The visible range, `today()`, and `isToday` all use that zone.
- Use `defaultDate` and `defaultView` for uncontrolled initial state. The date defaults to today in the calendar timezone; the view defaults to the first configured view.
- Use `date` with `onDateChange`, or `view` with `onViewChange`, for controlled state. A controlled view must be configured in `views`.
- Core `createCalendar` uses `date` and `view` directly, with `defaultView` as its uncontrolled-style initial-view alias.
