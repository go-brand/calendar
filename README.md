# GoBrand Calendar

[![npm version](https://img.shields.io/npm/v/@gobrand/calendar-core.svg)](https://www.npmjs.com/package/@gobrand/calendar-core)
[![CI](https://github.com/go-brand/calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/go-brand/calendar/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Headless month, week, and day calendars built directly on the Temporal API.

[Read the documentation](https://calendar.gobrand.app/docs).

- `@gobrand/react-calendar` provides React state, context, and view hooks.
- `@gobrand/calendar-core` provides the framework-independent controller and projections.
- Both packages use Temporal values, preserve configured-view types, and accept your event type through direct callbacks.

## Install

```bash
# React
pnpm add @gobrand/react-calendar @js-temporal/polyfill

# Core only
pnpm add @gobrand/calendar-core @js-temporal/polyfill
```

## Quick start

```tsx
import type { Temporal } from '@js-temporal/polyfill'
import { useCreateCalendar } from '@gobrand/react-calendar'

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

  return calendar.activeView.weeks.map(week => (
    <div key={week[0].id}>
      {week.map(day => (
        <div key={day.id}>
          {day.date.toString()}: {day.items.length} events
        </div>
      ))}
    </div>
  ))
}
```

## Start here

- [Build a React calendar](https://calendar.gobrand.app/docs/first-calendar)
- [Use Calendar Core](https://calendar.gobrand.app/docs/core)
- [Browse runnable examples](https://calendar.gobrand.app/docs/examples/multi-view)

## License

MIT © [Ruben Costa](https://x.com/PonziChad) / [Go Brand](https://gobrand.app)

## Contributing

The contributor toolchain is pinned in `package.json` to pnpm 11.13.1. Ordinary
pnpm requires Node 22.13 or newer; the standalone `@pnpm/exe` distribution bundles
its own Node for pnpm. CI uses `pnpm/action-setup` with `standalone: true` and
checks that package tests still run on the selected Node 20 or 22 runtime.
The action now recommends its successor `pnpm/setup` for pnpm 11 and newer.
These toolchain requirements do not change the packages' runtime support.

Run `pnpm install --frozen-lockfile`, then `pnpm build`, `pnpm typecheck`,
`pnpm lint`, `pnpm format:check`, `pnpm test --run`, `pnpm test:docs`, and
`pnpm verify:packages`. After documentation generation, check
`git diff --exit-code -- apps/www/public apps/www/src/generated skills/calendar`
and commit any intentional generated changes before releasing.
