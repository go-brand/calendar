import { Link } from '@tanstack/react-router';

const code = `const calendar = useCreateCalendar({
  views: { month: true, week: true, day: true },
  items: bookings,
  getDate: booking => booking.date,
})

calendar.activeView       // this month, each booking on its day
calendar.next()           // next month
calendar.setView('week')  // same bookings, by week`;

export function CalendarCode() {
  return (
    <>
      <section className="landing-section" aria-labelledby="code-title">
        <h2 id="code-title" className="landing-title">
          One hook. Your markup.
        </h2>
        <pre className="landing-code">
          <code>{code}</code>
        </pre>
      </section>

      <section className="landing-section landing-cta">
        <p>Start with one month view.</p>
        <Link to="/docs/$" params={{ _splat: 'first-calendar' }}>
          Read the docs
        </Link>
      </section>
    </>
  );
}
