# GoBrand Calendar

[![npm version](https://img.shields.io/npm/v/@gobrand/calendar-core.svg)](https://www.npmjs.com/package/@gobrand/calendar-core)
[![CI](https://github.com/go-brand/calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/go-brand/calendar/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The headless Temporal calendar for TypeScript and React.**

Month, week, and day views without `Date` bugs, CSS lock-in, or event schema lock-in. Bring your own markup, styling, and drag-and-drop library.

- **Tiny & tree-shakeable** — ~5 KB gzipped core, ~2.7 KB gzipped React, `sideEffects: false`, and zero-polyfill `/native` entrypoints.
- **Zero `Date` bugs** — Built exclusively on Temporal with explicit timezones, DST-safe math, and half-open visible ranges.
- **Headless, not bare** — Includes overlapping event collision layout, multi-day spanning bars, pointer time-snapping, and WAI-ARIA keyboard grid navigation.
- **Built for humans and coding agents** — Small, typed API surface with [llms.txt](https://calendar.gobrand.app/llms.txt), full runnable TSX examples in [llms-full.txt](https://calendar.gobrand.app/llms-full.txt), and an installable Agent Skill (`npx skills add go-brand/calendar`).

## Install

```bash
# React
pnpm add @gobrand/react-calendar @js-temporal/polyfill

# Core only (framework-agnostic)
pnpm add @gobrand/calendar-core @js-temporal/polyfill
```

Using native `globalThis.Temporal`? Import from `@gobrand/react-calendar/native` or `@gobrand/calendar-core/native` — no polyfill required.

## Start here

- [Documentation](https://calendar.gobrand.app/docs)
- [Build your first React calendar](https://calendar.gobrand.app/docs/first-calendar)
- [Core API & layout helpers](https://calendar.gobrand.app/docs/core)
- [Agent docs (`llms.txt`)](https://calendar.gobrand.app/llms.txt)

## License

MIT © [Ruben Costa](https://x.com/PonziChad) / [Go Brand](https://gobrand.app)
