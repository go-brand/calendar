const bugs = [
  ['Off by an hour after daylight saving', 'A day is one calendar day, even when daylight saving makes it 23 or 25 hours.'],
  ['Events counted twice at midnight', 'Ranges include the start and stop before the end, so a midnight event lands on one day.'],
  ['Today is wrong on the server', 'Set timeZone once. Today, the grid, and the query range all follow it.'],
] as const;

export function CalendarBugs() {
  return (
    <section className="landing-section" aria-labelledby="bugs-title">
      <h2 id="bugs-title" className="landing-title">
        The bugs you would have shipped
      </h2>
      <div className="landing-bugs">
        {bugs.map(([title, description]) => (
          <div key={title} className="landing-bug">
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
