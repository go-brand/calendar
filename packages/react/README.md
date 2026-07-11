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

const views = ['month', 'week', 'day'] as const

function Calendar() {
  const calendar = useCreateCalendar({
    views: { month: true, week: true, day: true },
    items: events,
    getDate: event => event.date,
  })
  const view = calendar.activeView

  return (
    <section>
      <button onClick={calendar.previous}>Previous</button>
      <button onClick={calendar.today}>Today</button>
      <button onClick={calendar.next}>Next</button>

      {views.map(name => (
        <button key={name} onClick={() => calendar.setView(name)}>
          {name}
        </button>
      ))}

      <h2>{calendar.title()}</h2>

      {view.view === 'month' && view.weeks.map(week => (
        <div key={week[0].id}>
          {week.map(day => (
            <div key={day.id}>
              {day.date.toString()}: {day.items.map(event => event.title).join(', ')}
            </div>
          ))}
        </div>
      ))}

      {view.view === 'week' && view.days.map(day => (
        <div key={day.id}>
          {day.date.toString()}: {day.items.map(event => event.title).join(', ')}
        </div>
      ))}

      {view.view === 'day' && (
        <div>
          {view.date.toString()}: {view.items.map(event => event.title).join(', ')}
        </div>
      )}
    </section>
  )
}
```

[See the complete styled, runnable month/week/day example](https://eng.gobrand.app/calendar/docs/examples/multi-view).

## Using Suspense

If each view fetches its own data, put the controller and controls above the Suspense boundary.
Then call `useCalendarView` inside the view after its data is ready. [See the complete Suspense example](https://eng.gobrand.app/calendar/docs/data-and-suspense).

React 18 and 19 are supported. [Read the documentation](https://eng.gobrand.app/calendar/docs).

MIT © [Ruben Costa](https://x.com/PonziChad) / [Go Brand](https://gobrand.app)
