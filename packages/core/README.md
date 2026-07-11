# Calendar Core

Framework-agnostic, headless calendar state and projections built directly on the Temporal API.

```bash
pnpm add @gobrand/calendar-core @js-temporal/polyfill
```

## Quick start

```ts
import { Temporal } from '@js-temporal/polyfill'
import { buildMonthView, createCalendar } from '@gobrand/calendar-core'

type Event = {
  id: string
  title: string
  date: Temporal.PlainDate
}

const events: Event[] = [
  { id: 'launch', title: 'Launch', date: Temporal.Now.plainDateISO() },
]

const calendar = createCalendar({
  views: { month: true },
})

const month = buildMonthView({
  calendar,
  items: events,
  getDate: event => event.date,
})

for (const day of month.weeks.flat()) {
  console.log(day.date.toString(), day.items.map(event => event.title))
}
```

The controller owns the current date, active view, timezone-aware visible range, and navigation.
`buildMonthView`, `buildWeekView`, and `buildDayView` add your events to the dates you render.

[Read the Core documentation](https://eng.gobrand.app/calendar/docs/core).

MIT © [Ruben Costa](https://x.com/PonziChad) / [Go Brand](https://gobrand.app)
