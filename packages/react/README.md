# @gobrand/react-calendar

[![npm version](https://img.shields.io/npm/v/@gobrand/react-calendar.svg)](https://www.npmjs.com/package/@gobrand/react-calendar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**React hooks for building calendars with the Temporal API.** Type-safe views, timezone-aware, optimized state management.

👉 **[Documentation](https://eng.gobrand.app/calendar)**

- **Built on Temporal API** - No Date objects, no moment.js, no date-fns
- **Timezone-aware** - Native DST handling with IANA timezones
- **Type-safe** - Conditional methods based on configured views
- **Multi-view** - Month, week, and day views with time slots
- **TanStack Store** - Optimized reactive state management

```tsx
import { useCreateCalendar, useView, CalendarProvider } from '@gobrand/react-calendar';

const accessor = { getDate: (e: Event) => e.date };

function App() {
  const calendar = useCreateCalendar<Event>({
    views: { month: { accessor } },
  });

  return (
    <CalendarProvider calendar={calendar}>
      <Calendar />
    </CalendarProvider>
  );
}

function Calendar() {
  const view = useView({ data: events });
  // view.data.weeks.flat().map(day => ...)
}
```

## Install

```bash
pnpm add @gobrand/react-calendar
```

**Peer dependencies:** React 18+ or 19+

## Docs

**[eng.gobrand.app/calendar](https://eng.gobrand.app/calendar)** — Full API reference, examples, and guides.

## License

MIT © [Ruben Costa](https://x.com/PonziChad) / [Go Brand](https://gobrand.app)
