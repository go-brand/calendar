---
name: calendar
description: Use when building calendar UIs with the Temporal API in TypeScript or React. Provides headless month, week, and day views, overlap and multi-day layout math, DnD time-snapping helpers, WAI-ARIA keyboard grid navigation, and zero-polyfill /native entrypoints.
---

# GoBrand Calendar

The headless Temporal calendar for TypeScript and React (~5 KB gzipped core, ~2.7 KB React, `sideEffects: false`). Zero `Date` bugs, zero CSS lock-in, zero event schema lock-in.

```bash
# React
pnpm add @gobrand/react-calendar @js-temporal/polyfill

# Core (framework-agnostic)
pnpm add @gobrand/calendar-core @js-temporal/polyfill
```

If `globalThis.Temporal` is available natively, import from `@gobrand/react-calendar/native` or `@gobrand/calendar-core/native` to ship zero polyfill code.

## Quick start

```tsx
import { Temporal } from '@js-temporal/polyfill'
import { useCalendarGrid, useCreateCalendar } from '@gobrand/react-calendar'

type Event = {
  id: string
  title: string
  date: Temporal.PlainDate
}

function Calendar({ events }: { events: Event[] }) {
  const calendar = useCreateCalendar({
    views: { month: true },
    items: events,
    getDate: event => event.date,
  })
  const { getGridProps, getDayCellProps } = useCalendarGrid({ calendar })
  const month = calendar.activeView

  return (
    <section>
      <button onClick={calendar.previous}>Previous</button>
      <button onClick={calendar.today}>Today</button>
      <button onClick={calendar.next}>Next</button>
      <h2>{calendar.title()}</h2>

      <div {...getGridProps()}>
        {month.weeks.map((week, row) => (
          <div key={row} role="row">
            {week.map(day => (
              <button key={day.id} type="button" {...getDayCellProps(day.date)}>
                {day.date.day} ({day.items.length})
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
```

## Public API

### `@gobrand/calendar-core` (and `@gobrand/calendar-core/native`)

| Export | Purpose |
|--------|---------|
| `createCalendar(options)` | Create an item-agnostic controller (`date`, `view`, `viewNames`, `views`, `timeZone`, `weekStartsOn`, `visibleRange`, `title`, navigation, `subscribe`). |
| `buildMonthView({ calendar, items?, getDate? })` | Project arbitrary records onto a month grid. |
| `buildWeekView({ calendar, items?, getDate?, getStart? })` | Project records onto a 7-day week and optional time slots. |
| `buildDayView({ calendar, items?, getDate?, getStart? })` | Project records onto a single day and time slots. |
| `layoutTimedEvents(items, options)` | DST-safe normalized `top`/`height` and overlapping `column`/`columns` geometry. |
| `layoutMultiDayEvents(items, options)` | Multi-day spanning bar `startCol`, `span`, `row`, `continuesBefore`, `continuesAfter`. |
| `getTimePosition(time, config?)` | Normalized `[0, 1]` position for current-time indicators. |
| `snapTimeFromPosition(ratio, config?)` | Snap a pointer ratio to the nearest `Temporal.PlainTime` slot. |
| `moveEvent(start, end, targetStart)` | Duration-preserving move (BigInt nanosecond exact) for DnD. |
| `resizeEvent(start, end, nextEnd, minDuration?)` | Min-duration-safe resize for DnD. |
| `getWeekdays(weekStartsOn?, locale?, format?)` | Localized 7-day header labels. |

### `@gobrand/react-calendar` (and `@gobrand/react-calendar/native`)

Re-exports everything from `@gobrand/calendar-core` plus:

| Export | Purpose |
|--------|---------|
| `useCreateCalendar(options)` | Controlled or uncontrolled controller hook, with optional simple-mode `items` + `activeView`. |
| `CalendarProvider` | Share a controller with child views (keep controls mounted above Suspense). |
| `useCalendar()` | Read the controller from `CalendarProvider`. |
| `useCalendarView({ view, calendar?, items?, getDate?, getStart? })` | Project view-local data (ideal below React Suspense). |
| `useCalendarGrid(options?)` | WAI-ARIA `getGridProps()` and `getDayCellProps(date)` with roving `tabIndex` and keyboard navigation. |

## Using Suspense

When each view fetches its own data, keep the controller above the Suspense boundary and call `useCalendarView` after the data is ready.

[See the complete Suspense example](https://calendar.gobrand.app/docs/data-and-suspense).

## Documentation

### React

| Page | Description |
|------|-------------|
| [Installation](https://calendar.gobrand.app/docs/installation) | Get started with GoBrand React Calendar |
| [Your first calendar](https://calendar.gobrand.app/docs/first-calendar) | Build a navigable month with one hook. |
| [Data and Suspense](https://calendar.gobrand.app/docs/data-and-suspense) | Keep calendar controls available while a view loads its events. |
| [Timezones and visible ranges](https://calendar.gobrand.app/docs/timezones-and-ranges) | Query half-open calendar ranges that remain correct across DST transitions. |
| [Controlled state and routing](https://calendar.gobrand.app/docs/controlled-state) | Synchronize calendar date and view with URLs or external application state. |
| [useCreateCalendar](https://calendar.gobrand.app/docs/api/use-create-calendar) | Create a controlled or uncontrolled item-agnostic controller, with optional simple-mode data. |
| [useCalendar](https://calendar.gobrand.app/docs/api/use-calendar) | Read the item-agnostic calendar controller from context. |
| [useCalendarView](https://calendar.gobrand.app/docs/api/use-calendar-view) | Put events into one view from a shared calendar controller. |
| [useCalendarGrid](https://calendar.gobrand.app/docs/api/use-calendar-grid) | Headless WAI-ARIA grid and keyboard navigation prop-getters |
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

### Core

| Page | Description |
|------|-------------|
| [Installation](https://calendar.gobrand.app/docs/core/installation) | Get started with GoBrand Calendar Core |
| [createCalendar](https://calendar.gobrand.app/docs/core/create-calendar) | Create an item-agnostic controller from a non-empty view configuration. |
| [View Projections](https://calendar.gobrand.app/docs/core/projections) | Build month, week, and day models from controller state and local data. |
| [Visible ranges](https://calendar.gobrand.app/docs/core/visible-ranges) | Understand Calendar's timezone-aware, half-open query boundary. |
| [Layout & Utilities](https://calendar.gobrand.app/docs/core/utilities) | Headless overlap layout, multi-day spanning bars, DnD time math, and localized weekdays |

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

## Initialization and timezone

- `timeZone` accepts an IANA timezone string and defaults to `Temporal.Now.timeZoneId()`. The visible range, `today()`, and `isToday` all use that zone.
- Use `defaultDate` and `defaultView` for uncontrolled initial state. The date defaults to today in the calendar timezone; the view defaults to the first configured view.
- Use `date` with `onDateChange`, or `view` with `onViewChange`, for controlled state. A controlled view must be configured in `views`.
- Core `createCalendar` uses `date` and `view` directly, with `defaultView` as its uncontrolled-style initial-view alias.
