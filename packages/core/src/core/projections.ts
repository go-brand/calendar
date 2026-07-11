import { Temporal } from '@js-temporal/polyfill';
import type {
  CalendarController,
  DayView,
  MonthView,
  NonEmptyCalendarViews,
  ProjectionData,
  TimeSlot,
  TimedViewConfig,
  ViewConfig,
  WeekDay,
  WeekView,
} from '../types';
import { getCalendarMetadata } from './calendar';

type ProjectionOptions<TViews extends NonEmptyCalendarViews, TItem> = {
  calendar: CalendarController<TViews>;
} & ProjectionData<TItem>;

function projectionData<TItem>(options: ProjectionData<TItem>) {
  if (options.items !== undefined && options.getDate === undefined) {
    throw new Error('getDate is required when items are supplied');
  }
  return {
    items: options.items ?? [],
    getDate: options.getDate,
    getStart: options.getStart,
  };
}

function assertConfigured(calendar: CalendarController, view: 'month' | 'week' | 'day') {
  if (!(view in calendar.views)) {
    throw new Error(`Calendar view "${view}" is not configured`);
  }
}

function itemsByDate<TItem>(
  items: readonly TItem[],
  getDate: ((item: TItem) => Temporal.PlainDate) | undefined,
) {
  const grouped = new Map<string, TItem[]>();
  if (!getDate) return grouped;

  for (const item of items) {
    const key = getDate(item).toString();
    const dateItems = grouped.get(key);
    if (dateItems) dateItems.push(item);
    else grouped.set(key, [item]);
  }
  return grouped;
}

function timedGeometry(config: TimedViewConfig) {
  return {
    dayStart: config.dayStart ?? Temporal.PlainTime.from('00:00'),
    dayEnd: config.dayEnd ?? Temporal.PlainTime.from('23:59:59.999999999'),
    slotDuration: config.slotDuration ?? Temporal.Duration.from({ hours: 1 }),
  };
}

function buildTimeSlots<TItem>(
  date: Temporal.PlainDate,
  items: readonly TItem[],
  getStart: ((item: TItem) => Temporal.ZonedDateTime) | undefined,
  config: TimedViewConfig,
): TimeSlot<TItem>[] {
  const { dayStart, dayEnd, slotDuration } = timedGeometry(config);
  const slots: TimeSlot<TItem>[] = [];
  let slotStart = dayStart;

  while (Temporal.PlainTime.compare(slotStart, dayEnd) < 0) {
    const candidateEnd = slotStart.add(slotDuration);
    const wrapped = Temporal.PlainTime.compare(candidateEnd, slotStart) <= 0;
    const slotEnd =
      wrapped || Temporal.PlainTime.compare(candidateEnd, dayEnd) > 0 ? dayEnd : candidateEnd;
    const slotItems = getStart
      ? items.filter((item) => {
          const itemTime = getStart(item).toPlainTime();
          return (
            Temporal.PlainTime.compare(itemTime, slotStart) >= 0 &&
            Temporal.PlainTime.compare(itemTime, slotEnd) < 0
          );
        })
      : [];

    slots.push({
      id: `${date.toString()}-${slotStart.toString()}`,
      hour: slotStart.hour,
      minute: slotStart.minute,
      time: slotStart,
      items: slotItems,
    });

    if (wrapped || Temporal.PlainTime.compare(slotEnd, slotStart) <= 0) break;
    slotStart = slotEnd;
  }

  return slots;
}

export function buildMonthView<TViews extends NonEmptyCalendarViews, TItem>(
  options: ProjectionOptions<TViews & { month: ViewConfig['month'] }, TItem>,
): MonthView<TItem>;
export function buildMonthView<TViews extends NonEmptyCalendarViews>(options: {
  calendar: CalendarController<TViews & { month: ViewConfig['month'] }>;
}): MonthView<never>;
export function buildMonthView<TItem>(
  options: ProjectionOptions<NonEmptyCalendarViews, TItem>,
): MonthView<TItem> {
  const { calendar } = options;
  assertConfigured(calendar, 'month');
  const { items, getDate } = projectionData(options);
  const grouped = itemsByDate(items, getDate);
  const { timeZone, weekStartsOn } = getCalendarMetadata(calendar);
  const today = Temporal.Now.zonedDateTimeISO(timeZone).toPlainDate();
  const month = Temporal.PlainYearMonth.from(calendar.date);
  const first = month.toPlainDate({ day: 1 });
  const last = month.toPlainDate({ day: month.daysInMonth });
  const start = first.subtract({ days: (first.dayOfWeek - weekStartsOn + 7) % 7 });
  const end = last.add({ days: (weekStartsOn + 6 - last.dayOfWeek + 7) % 7 });
  const weeks: MonthView<TItem>['weeks'] = [];
  let current = start;

  while (Temporal.PlainDate.compare(current, end) <= 0) {
    const week = [] as MonthView<TItem>['weeks'][number];
    for (let offset = 0; offset < 7; offset += 1) {
      const date = current.add({ days: offset });
      week.push({
        id: `${month.toString()}-${date.toString()}`,
        date,
        isCurrentMonth: date.month === month.month && date.year === month.year,
        isToday: date.equals(today),
        items: grouped.get(date.toString()) ?? [],
      });
    }
    weeks.push(week);
    current = current.add({ weeks: 1 });
  }

  return { view: 'month', month, weeks };
}

export function buildWeekView<TViews extends NonEmptyCalendarViews, TItem>(
  options: ProjectionOptions<TViews & { week: ViewConfig['week'] }, TItem>,
): WeekView<TItem>;
export function buildWeekView<TViews extends NonEmptyCalendarViews>(options: {
  calendar: CalendarController<TViews & { week: ViewConfig['week'] }>;
}): WeekView<never>;
export function buildWeekView<TItem>(
  options: ProjectionOptions<NonEmptyCalendarViews, TItem>,
): WeekView<TItem> {
  const { calendar } = options;
  assertConfigured(calendar, 'week');
  const { items, getDate, getStart } = projectionData(options);
  const grouped = itemsByDate(items, getDate);
  const { timeZone, weekStartsOn } = getCalendarMetadata(calendar);
  const today = Temporal.Now.zonedDateTimeISO(timeZone).toPlainDate();
  const weekStart = calendar.date.subtract({
    days: (calendar.date.dayOfWeek - weekStartsOn + 7) % 7,
  });
  const config = calendar.views.week ?? {};
  const days: WeekDay<TItem>[] = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const date = weekStart.add({ days: offset });
    const dayItems = grouped.get(date.toString()) ?? [];
    days.push({
      id: `${weekStart.toString()}-${date.toString()}`,
      date,
      isToday: date.equals(today),
      items: dayItems,
      timeSlots: buildTimeSlots(date, dayItems, getStart, config),
    });
  }

  return {
    view: 'week',
    days,
    weekStart,
    weekEnd: weekStart.add({ days: 6 }),
  };
}

export function buildDayView<TViews extends NonEmptyCalendarViews, TItem>(
  options: ProjectionOptions<TViews & { day: ViewConfig['day'] }, TItem>,
): DayView<TItem>;
export function buildDayView<TViews extends NonEmptyCalendarViews>(options: {
  calendar: CalendarController<TViews & { day: ViewConfig['day'] }>;
}): DayView<never>;
export function buildDayView<TItem>(
  options: ProjectionOptions<NonEmptyCalendarViews, TItem>,
): DayView<TItem> {
  const { calendar } = options;
  assertConfigured(calendar, 'day');
  const { items, getDate, getStart } = projectionData(options);
  const grouped = itemsByDate(items, getDate);
  const { timeZone } = getCalendarMetadata(calendar);
  const date = calendar.date;
  const dayItems = grouped.get(date.toString()) ?? [];

  return {
    view: 'day',
    id: date.toString(),
    date,
    isToday: date.equals(Temporal.Now.zonedDateTimeISO(timeZone).toPlainDate()),
    items: dayItems,
    timeSlots: buildTimeSlots(date, dayItems, getStart, calendar.views.day ?? {}),
  };
}
