# Calendar Core

Framework-agnostic, headless calendar state and projections built directly on the Temporal API.

```bash
pnpm add @gobrand/calendar-core
```

```ts
import { Temporal } from '@js-temporal/polyfill'
import { buildMonthView, createCalendar } from '@gobrand/calendar-core'

const calendar = createCalendar({
  views: { month: true, week: true },
  date: Temporal.PlainDate.from('2026-07-10'),
  timeZone: 'America/Asuncion',
})

const month = buildMonthView({
  calendar,
  items: events,
  getDate: event => event.date,
})
```

The controller owns date, active view, timezone-aware half-open query range, and navigation. Item types stay local to `buildMonthView`, `buildWeekView`, and `buildDayView`.

Full documentation: [eng.gobrand.app/calendar](https://eng.gobrand.app/calendar)

MIT © [Ruben Costa](https://x.com/PonziChad) / [Go Brand](https://gobrand.app)
