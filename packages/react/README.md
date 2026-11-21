# @gobrand/react-calendar

**The headless Temporal calendar for React.**

Build timezone-safe month, week, and day calendars with your own markup, styles, and drag-and-drop library. Full TypeScript inference, WAI-ARIA keyboard navigation, overlap layout math, and an optional zero-polyfill `/native` export.

```bash
pnpm add @gobrand/react-calendar @js-temporal/polyfill
```

> Using native `globalThis.Temporal`? Import from `@gobrand/react-calendar/native` to ship zero polyfill code.

## Quick start

```tsx
import { Temporal } from '@js-temporal/polyfill';
import { useCalendarGrid, useCreateCalendar } from '@gobrand/react-calendar';

type Event = { id: string; title: string; date: Temporal.PlainDate };

function Calendar({ events }: { events: Event[] }) {
  const calendar = useCreateCalendar({
    views: { month: true },
    items: events,
    getDate: (event) => event.date,
  });
  const { getGridProps, getDayCellProps } = useCalendarGrid({ calendar });

  return (
    <section>
      <header>
        <button onClick={calendar.previous}>Prev</button>
        <button onClick={calendar.today}>Today</button>
        <button onClick={calendar.next}>Next</button>
        <h2>{calendar.title()}</h2>
      </header>

      <div {...getGridProps()}>
        {calendar.activeView.weeks.map((week, i) => (
          <div key={i} role="row">
            {week.map((day) => (
              <button key={day.id} {...getDayCellProps(day.date)}>
                {day.date.day} ({day.items.length})
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
```

## What's included

- **Hooks & composition** — `useCreateCalendar`, `CalendarProvider`, `useCalendar`, `useCalendarView` (works cleanly with React Suspense).
- **Accessible keyboard grid** — `useCalendarGrid` provides `role="grid"` / `gridcell`, roving `tabIndex`, and arrow/`Home`/`End`/`PageUp`/`PageDown` navigation.
- **Headless layout & DnD helpers** — Re-exports `layoutTimedEvents`, `layoutMultiDayEvents`, `getTimePosition`, `snapTimeFromPosition`, `moveEvent`, and `resizeEvent` from `@gobrand/calendar-core`.
- **Native Temporal export** — `@gobrand/react-calendar/native` uses `globalThis.Temporal` with zero polyfill imports.

React 18 and 19 supported. [Read the documentation](https://calendar.gobrand.app/docs) · [Agent docs (`llms.txt`)](https://calendar.gobrand.app/llms.txt)

MIT © [Ruben Costa](https://x.com/PonziChad) / [Go Brand](https://gobrand.app)
