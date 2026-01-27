# Calendar Core

[![npm version](https://img.shields.io/npm/v/@gobrand/calendar-core.svg)](https://www.npmjs.com/package/@gobrand/calendar-core)
[![CI](https://github.com/go-brand/calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/go-brand/calendar/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Framework-agnostic calendar utilities built with the Temporal API.** Simple, composable functions for building month, week, and day views.

👉 **[Documentation](https://eng.gobrand.app/calendar)**

- **Built on Temporal API** - No Date objects, no moment.js, no date-fns
- **Timezone-aware** - Native DST handling with IANA timezones
- **Type-safe** - Full TypeScript with proper Temporal types
- **Framework-agnostic** - Use with React, Vue, Svelte, or vanilla JS
- **Data-agnostic** - Works with any data type through accessor pattern

```typescript
import { buildMonth, createCalendarAccessor, getWeekdays } from '@gobrand/calendar-core';

const accessor = createCalendarAccessor<Event>({
  getDate: (e) => e.date,
});

const month = buildMonth(2025, 1, { weekStartsOn: 1, data: events, accessor });

month.weeks.flat().forEach(day => {
  console.log(day.date.toString(), day.items.length);
});
```

## Install

```bash
pnpm add @gobrand/calendar-core
```

## Docs

**[eng.gobrand.app/calendar](https://eng.gobrand.app/calendar)** — Full API reference, examples, and guides.

## License

MIT © [Ruben Costa](https://x.com/PonziChad) / [Go Brand](https://gobrand.app)
