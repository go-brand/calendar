# React Calendar

Headless React bindings for the Temporal-first calendar controller.

```bash
pnpm add @gobrand/react-calendar
```

## Simple mode

```tsx
import { useCreateCalendar } from '@gobrand/react-calendar'

function Calendar({ events }: { events: Event[] }) {
  const calendar = useCreateCalendar({
    views: { month: true, week: true },
    items: events,
    getDate: event => event.date,
    getStart: event => event.startsAt,
  })

  return <CalendarContent view={calendar.activeView} />
}
```

## Suspense composition

```tsx
function Calendar() {
  const calendar = useCreateCalendar({ views: { month: true, week: true } })

  return (
    <CalendarProvider calendar={calendar}>
      <CalendarControls />
      <Suspense fallback={<CalendarSkeleton />}>
        <ActiveView />
      </Suspense>
    </CalendarProvider>
  )
}

function MonthView() {
  const { data } = useSuspenseQuery(monthQuery)
  const month = useCalendarView({
    view: 'month',
    items: data.summaries,
    getDate: summary => summary.date,
  })
  return <MonthGrid month={month} />
}
```

React 18 and 19 are supported. Full documentation: [eng.gobrand.app/calendar](https://eng.gobrand.app/calendar)

MIT © [Ruben Costa](https://x.com/PonziChad) / [Go Brand](https://gobrand.app)
