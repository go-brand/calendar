# @gobrand/calendar-core

**The headless Temporal calendar engine for TypeScript.**

Framework-agnostic month, week, and day projections, overlapping event layout, multi-day spanning bars, and DnD-ready time math — built exclusively on the Temporal API.

```bash
pnpm add @gobrand/calendar-core @js-temporal/polyfill
```

> Using native `globalThis.Temporal`? Import from `@gobrand/calendar-core/native` to ship zero polyfill code.

## Quick start

```ts
import { Temporal } from '@js-temporal/polyfill';
import { buildMonthView, createCalendar } from '@gobrand/calendar-core';

type Event = { id: string; title: string; date: Temporal.PlainDate };

const events: Event[] = [
  { id: 'launch', title: 'Launch', date: Temporal.Now.plainDateISO() },
];

const calendar = createCalendar({ views: { month: true } });

const month = buildMonthView({
  calendar,
  items: events,
  getDate: (event) => event.date,
});
```

## What's included

- **Controller & projections** — `createCalendar`, `buildMonthView`, `buildWeekView`, `buildDayView`, `getWeekdays`.
- **Overlap & multi-day layout** — `layoutTimedEvents` (DST-safe `top`, `height`, `column`, `columns`) and `layoutMultiDayEvents` (`startCol`, `span`, `row`, `continuesBefore`, `continuesAfter`).
- **DnD & pointer math** — `getTimePosition`, `snapTimeFromPosition`, `moveEvent`, `resizeEvent` for clean integration with `dnd-kit`, Pragmatic DnD, or native pointer events.
- **Native Temporal export** — `@gobrand/calendar-core/native` uses `globalThis.Temporal` with zero polyfill imports.

[Read the documentation](https://calendar.gobrand.app/docs/core) · [Agent docs (`llms.txt`)](https://calendar.gobrand.app/llms.txt)

MIT © [Ruben Costa](https://x.com/PonziChad) / [Go Brand](https://gobrand.app)
