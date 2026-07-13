# React Calendar

Build month, week, and day calendars with Temporal. The package manages calendar state and gives
you the dates and events to render. You provide the markup and styles.

```bash
pnpm add @gobrand/react-calendar @js-temporal/polyfill
```

## Quick start

```tsx
import { Temporal } from '@js-temporal/polyfill'
import { useCreateCalendar } from '@gobrand/react-calendar'

type Event = {
  id: string
  title: string
  date: Temporal.PlainDate
}

const events: Event[] = [
  { id: 'launch', title: 'Launch', date: Temporal.Now.plainDateISO() },
]

function Calendar() {
  const calendar = useCreateCalendar({
    views: { month: true },
    items: events,
    getDate: event => event.date,
  })
  const month = calendar.activeView

  return (
    <section>
      <button onClick={calendar.previous}>Previous</button>
      <button onClick={calendar.today}>Today</button>
      <button onClick={calendar.next}>Next</button>
      <h2>{calendar.title()}</h2>

      {month.weeks.flat().map(day => (
        <div key={day.id}>
          {day.date.toString()}: {day.items.map(event => event.title).join(', ')}
        </div>
      ))}
    </section>
  )
}
```

[See the complete styled month example](https://calendar.gobrand.app/docs/examples/basic-month).

Add week or day views when you need them. Timed views can also receive a `getStart` accessor for
placing events into time slots. [See the multi-view example](https://calendar.gobrand.app/docs/examples/multi-view).

## Using Suspense

If a view fetches its own data, put the controller and controls above the Suspense boundary. Then
call `useCalendarView` after the data is ready. [See the complete Suspense example](https://calendar.gobrand.app/docs/data-and-suspense).

React 18 and 19 are supported. [Read the documentation](https://calendar.gobrand.app/docs).

MIT © [Ruben Costa](https://x.com/PonziChad) / [Go Brand](https://gobrand.app)
