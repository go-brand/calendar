import { Temporal } from '@js-temporal/polyfill';
import { useCreateCalendar } from '@gobrand/react-calendar';

type Event = {
  id: string;
  title: string;
  date: Temporal.PlainDate;
};

const events: Event[] = [{ id: 'launch', title: 'Launch', date: Temporal.Now.plainDateISO() }];

export function Calendar() {
  const calendar = useCreateCalendar({
    views: { month: true },
    items: events,
    getDate: (event) => event.date,
  });
  const month = calendar.activeView;

  return (
    <section>
      <button onClick={calendar.previous}>Previous</button>
      <button onClick={calendar.today}>Today</button>
      <button onClick={calendar.next}>Next</button>
      <h2>{calendar.title()}</h2>

      {month.weeks.flat().map((day) => (
        <div key={day.id}>
          {day.date.toString()}: {day.items.map((event) => event.title).join(', ')}
        </div>
      ))}
    </section>
  );
}
