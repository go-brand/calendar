import { Temporal } from '@js-temporal/polyfill';

export type Event = {
  id: string;
  date: string;
  start?: string; // ISO ZonedDateTime string for time-aware events
  title: string;
};

const titles = ['Standup', 'Planning', 'Review', 'Launch', 'Demo', 'Retro', 'Sprint', 'Deploy', 'Sync', 'Lunch'];

// Generate events around the current date so calendars are never empty
function generateEvents(): Event[] {
  const timeZone = Temporal.Now.timeZoneId();
  const today = Temporal.Now.plainDateISO();
  const events: Event[] = [];

  // Generate events for -2 months to +2 months
  for (let monthOffset = -2; monthOffset <= 2; monthOffset++) {
    const month = today.add({ months: monthOffset });
    const daysInMonth = month.daysInMonth;

    // Add events on various days throughout each month
    const eventDays = [3, 5, 8, 12, 15, 18, 22, 25, 28].filter(d => d <= daysInMonth);
    eventDays.forEach((day, i) => {
      const date = month.with({ day });
      events.push({
        id: `${monthOffset}-${day}`,
        date: date.toString(),
        title: titles[(monthOffset + 2 + i) % titles.length],
      });
    });
  }

  // Add 2 events for today at specific times (9 AM and 11 AM - visible in week view's first 5 slots)
  const todayAt9am = today.toZonedDateTime({ timeZone, plainTime: Temporal.PlainTime.from('09:00') });
  const todayAt11am = today.toZonedDateTime({ timeZone, plainTime: Temporal.PlainTime.from('11:00') });

  events.push({
    id: 'today-9am',
    date: today.toString(),
    start: todayAt9am.toString(),
    title: 'Team Sync',
  });

  events.push({
    id: 'today-11am',
    date: today.toString(),
    start: todayAt11am.toString(),
    title: 'Project Review',
  });

  // Add extra events around today for day/week views (excluding today itself)
  // Give them times within the 8-18 range so they show in time slots
  for (let dayOffset = -3; dayOffset <= 3; dayOffset++) {
    if (dayOffset === 0) continue; // Skip today, we already added specific events
    const date = today.add({ days: dayOffset });
    const hour = 9 + Math.abs(dayOffset); // Vary the time: 10, 11, 12 AM
    const startTime = date.toZonedDateTime({ timeZone, plainTime: Temporal.PlainTime.from({ hour, minute: 0 }) });
    events.push({
      id: `nearby-${dayOffset}`,
      date: date.toString(),
      start: startTime.toString(),
      title: titles[(dayOffset + 3) % titles.length],
    });
  }

  return events;
}

export const allEvents = generateEvents();

export async function fetchEvents(start: Temporal.ZonedDateTime, end: Temporal.ZonedDateTime): Promise<Event[]> {
  await new Promise((r) => setTimeout(r, 300));
  return allEvents.filter((e) => {
    const date = Temporal.PlainDate.from(e.date);
    return (
      Temporal.PlainDate.compare(date, start.toPlainDate()) >= 0 &&
      Temporal.PlainDate.compare(date, end.toPlainDate()) <= 0
    );
  });
}

// Get the browser's timezone for consistent time handling
const browserTimeZone = Temporal.Now.timeZoneId();

export const accessor = {
  getDate: (e: Event) => Temporal.PlainDate.from(e.date),
  getStart: (e: Event) => {
    if (e.start) {
      return Temporal.ZonedDateTime.from(e.start);
    }
    // Default to midnight in browser timezone for events without specific time
    return Temporal.PlainDate.from(e.date).toZonedDateTime({
      timeZone: browserTimeZone,
      plainTime: Temporal.PlainTime.from('00:00'),
    });
  },
};
