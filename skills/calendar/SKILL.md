---
name: calendar
description: Use when building calendar UIs with the Temporal API. Provides month, week, and day views with timezone awareness, DST-safe operations, and React hooks for state management.
---

# temporal-calendar - Calendar Building Blocks

Lightweight utility library for building calendar UIs with the Temporal API.

```bash
# Core (framework-agnostic)
npm install @gobrand/calendar-core

# React
npm install @gobrand/react-calendar
```

## Quick Start

```tsx
import { useCreateCalendar, CalendarProvider, useView } from '@gobrand/react-calendar';

const calendar = useCreateCalendar({
  views: {
    month: { accessor: { getDate: (e) => e.date } },
  },
});

const view = useView({ data: events });
// view.data.weeks contains the month grid
```

---

## React

| Function | Description |
|----------|-------------|
| `Installation` | Get started with GoBrand React Calendar |
| `createCalendarAccessor()` | Type-safe helper for defining how data maps to calendar dates |
| `createCalendarViews()` | Type-safe helper for creating calendar view configurations |
| `useCreateCalendar()` | Creates a calendar instance with React state management |
| `useCalendar()` | Retrieves calendar instance from context |
| `useView()` | Gets memoized view data for the calendar |
| `CalendarProvider` | Provides calendar instance to descendant components via context |
| `Calendar Instance` | The calendar object returned by useCreateCalendar and useCalendar |
| `Calendar Types` | Core calendar types and state management |
| `View Types` | Types for month, week, and day views |
| `Helper Types` | Utility types for type extraction and component props |
| `Month View` | Build a month calendar with data fetching |
| `Week View` |  |
| `Day View` | Build a day calendar with hourly time slots |
| `Multi-View Calendar` | Switch between month, week, and day views |

## Core

| Function | Description |
|----------|-------------|
| `Installation` | Get started with GoBrand Calendar Core |
| `createCalendar()` | Create a stateful calendar instance with navigation, multi-view support, and automatic date range computation |
| `Accessors` | Map any data type to calendar dates |
| `buildMonth` | Standalone function to build a month grid |
| `buildWeek` | Standalone function to build a week with time slots |
| `buildDay` | Standalone function to build a day with time slots |
| `Utilities` | Formatting, navigation, and timezone helpers |

## Key Types

```ts
type CalendarMonth<T> = { weeks: CalendarDay<T>[][]; month: PlainYearMonth };
type CalendarDay<T> = { date: PlainDate; isCurrentMonth: boolean; isToday: boolean; items: T[] };
type CalendarAccessor<T> = { getDate: (item: T) => PlainDate; getStart?: ...; getEnd?: ... };
type DateRange = { start: ZonedDateTime; end: ZonedDateTime };
```
