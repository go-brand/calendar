import { Temporal } from '@js-temporal/polyfill';
import { useCreateCalendar } from '@gobrand/react-calendar';

type Event = {
  id: string;
  title: string;
  date: Temporal.PlainDate;
};

const events: Event[] = [
  { id: 'launch', title: 'Launch', date: Temporal.PlainDate.from('2026-07-14') },
];

const views = ['month', 'week', 'day'] as const;

export function Calendar() {
  const calendar = useCreateCalendar({
    views: { month: true, week: true, day: true },
    defaultDate: Temporal.PlainDate.from('2026-07-14'),
    items: events,
    getDate: (event) => event.date,
  });
  const view = calendar.activeView;

  return (
    <section>
      <button onClick={calendar.previous}>Previous</button>
      <button onClick={calendar.today}>Today</button>
      <button onClick={calendar.next}>Next</button>

      {views.map((name) => (
        <button key={name} onClick={() => calendar.setView(name)}>
          {name}
        </button>
      ))}

      <h2>{calendar.title()}</h2>

      {view.view === 'month' &&
        view.weeks.flat().map((day) => (
          <div key={day.id}>
            {day.date.toString()}: {day.items.map((event) => event.title).join(', ')}
          </div>
        ))}

      {view.view === 'week' &&
        view.days.map((day) => (
          <div key={day.id}>
            {day.date.toString()}: {day.items.map((event) => event.title).join(', ')}
          </div>
        ))}

      {view.view === 'day' && (
        <div>
          {view.date.toString()}: {view.items.map((event) => event.title).join(', ')}
        </div>
      )}
    </section>
  );
}
