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

## Start here

- [Build a React calendar](https://calendar.gobrand.app/docs/first-calendar)
- [Use Calendar Core](https://calendar.gobrand.app/docs/core)
- [Browse runnable examples](https://calendar.gobrand.app/docs/examples/multi-view)

## License

MIT © [Ruben Costa](https://x.com/PonziChad) / [Go Brand](https://gobrand.app)
