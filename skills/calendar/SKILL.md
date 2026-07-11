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
npm install @gobrand/react-calendar @js-temporal/polyfill @tanstack/react-query
```

## Simple mode

```tsx
import { Temporal } from '@js-temporal/polyfill'
import { useCreateCalendar } from '@gobrand/react-calendar'

type Event = { id: string; date: Temporal.PlainDate; startsAt: Temporal.ZonedDateTime }

function Calendar({ events }: { events: Event[] }) {
  const calendar = useCreateCalendar({
    views: { month: true, week: true },
    items: events,
    getDate: event => event.date,
    getStart: event => event.startsAt,
  })

  if (calendar.activeView.view !== 'month') return null
  return calendar.activeView.weeks.flat().map(day => (
    <div key={day.id}>{day.items.length}</div>
  ))
}
```

## Suspense composition

```tsx
import { Suspense } from 'react'
import { Temporal } from '@js-temporal/polyfill'
import { CalendarProvider, useCalendar, useCalendarView, useCreateCalendar } from '@gobrand/react-calendar'
import type { MonthView as MonthViewModel } from '@gobrand/react-calendar'
import { QueryClient, QueryClientProvider, queryOptions, useSuspenseQuery } from '@tanstack/react-query'

type Summary = { id: string; date: string }
const queryClient = new QueryClient()
function monthQuery(range: { start: Temporal.ZonedDateTime; end: Temporal.ZonedDateTime }) {
  return queryOptions({
    queryKey: ['calendar', 'month', range.start.toString(), range.end.toString()],
    queryFn: async (): Promise<{ summaries: Summary[] }> => {
      const params = new URLSearchParams({
        start: range.start.toInstant().toString(),
        end: range.end.toInstant().toString(),
      })
      const response = await fetch(`/api/summaries?${params}`)
      if (!response.ok) throw new Error('Failed to load calendar summaries')
      return response.json()
    },
  })
}

function CalendarControls() {
  const calendar = useCalendar()
  return <button onClick={calendar.next}>{calendar.title()}</button>
}
function CalendarSkeleton() { return <div>Loading</div> }
function MonthGrid({ month }: { month: MonthViewModel<Summary> }) {
  return <div>{month.weeks.length}</div>
}

function Calendar() {
  const calendar = useCreateCalendar({ views: { month: true, week: true } })
  return (
    <QueryClientProvider client={queryClient}>
      <CalendarProvider calendar={calendar}>
        <CalendarControls />
        <Suspense fallback={<CalendarSkeleton />}>
          <MonthView />
        </Suspense>
      </CalendarProvider>
    </QueryClientProvider>
  )
}

function MonthView() {
  const calendar = useCalendar()
  const { data } = useSuspenseQuery(monthQuery(calendar.visibleRange))
  const month = useCalendarView({
    view: 'month',
    items: data.summaries,
    getDate: summary => Temporal.PlainDate.from(summary.date),
  })
  return <MonthGrid month={month} />
}
```

## React

| Function | Description |
|----------|-------------|
| `Installation` | Get started with GoBrand React Calendar |
| `Your first calendar` | Build a navigable month from ordinary values and inferred item types. |
| `Data and Suspense` | Keep controls interactive while each calendar view owns its query and item type. |
| `Timezones and visible ranges` | Query half-open calendar ranges that remain correct across DST transitions. |
| `Controlled state and routing` | Synchronize calendar date and view with URLs or external application state. |
| `useCreateCalendar()` | Create a controlled or uncontrolled item-agnostic controller, with optional simple-mode data. |
| `useCalendar()` | Read the item-agnostic calendar controller from context. |
| `useCalendarView()` | Project view-local data through the item-agnostic calendar controller. |
| `CalendarProvider` | Share an item-agnostic controller with controls and view projections. |
| `Calendar Controller` | Item-agnostic calendar state, navigation, and visible query range. |
| `View Models` | Discriminated month, week, and day models with locally inferred items. |
| `Range and Configuration Types` | Public types for configured views, geometry, and half-open query ranges. |
| `Month View` | Build a month calendar with data fetching |
| `Week View` |  |
| `Day View` | Build a day calendar with hourly time slots |
| `Multi-View Calendar` | Switch between month, week, and day views |

## Core

| Function | Description |
|----------|-------------|
| `Installation` | Get started with GoBrand Calendar Core |
| `createCalendar()` | Create an item-agnostic controller from a non-empty view configuration. |
| `View Projections` | Build month, week, and day models from controller state and local data. |
| `Visible ranges` | Understand Calendar's timezone-aware, half-open query boundary. |
| `Utilities` | Formatting, navigation, and timezone helpers |

## Key Types

```ts
type ViewConfig = { month: true | Record<string, never>; week: true | TimedViewConfig; day: true | TimedViewConfig };
type VisibleRange = { start: Temporal.ZonedDateTime; end: Temporal.ZonedDateTime };
type CalendarController<TViews> = { date: Temporal.PlainDate; view: keyof TViews; visibleRange: VisibleRange; title(): string; next(): void; previous(): void };
type MonthView<TItem> = { view: 'month'; weeks: CalendarDay<TItem>[][]; month: Temporal.PlainYearMonth };
type CalendarDay<TItem> = { id: string; date: Temporal.PlainDate; isCurrentMonth: boolean; isToday: boolean; items: TItem[] };
```

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
