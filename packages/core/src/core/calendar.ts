import { Temporal } from '@js-temporal/polyfill';
import type {
  CalendarController,
  CalendarOptions,
  CalendarViews,
  ConfiguredView,
  NonEmptyCalendarViews,
  ResolvedCalendarViews,
  TimedViewConfig,
  ViewName,
  VisibleRange,
  Weekday,
} from '../types';
import { getDayDateRange, getMonthDateRange, getWeekDateRange } from '../utils/dateRanges';

type ControllerMetadata = {
  timeZone: string;
  weekStartsOn: Weekday;
};

const controllerMetadata = new WeakMap<object, ControllerMetadata>();

function localeWeekStart(): Weekday {
  const locale = new Intl.Locale(Intl.DateTimeFormat().resolvedOptions().locale) as Intl.Locale & {
    getWeekInfo?: () => { firstDay: number };
    weekInfo?: { firstDay: number };
  };
  const firstDay = locale.getWeekInfo?.().firstDay ?? locale.weekInfo?.firstDay;
  if (firstDay === undefined) return 1;
  return firstDay as Weekday;
}

function validateTimedView(name: 'week' | 'day', config: TimedViewConfig) {
  if (config.slotDuration && config.slotDuration.sign <= 0) {
    throw new Error(`${name} slotDuration must be positive`);
  }
  if (
    config.dayStart &&
    config.dayEnd &&
    Temporal.PlainTime.compare(config.dayEnd, config.dayStart) <= 0
  ) {
    throw new Error(`${name} dayEnd must be after dayStart`);
  }
}

function assertViewConfigured(views: object, view: string): asserts view is ViewName {
  if (!(view in views)) {
    throw new Error(`Calendar view "${view}" is not configured`);
  }
}

function resolveViews<TViews extends NonEmptyCalendarViews>(
  input: TViews,
  configuredViews: ConfiguredView<TViews>[],
): ResolvedCalendarViews<TViews> {
  const entries = configuredViews.map((name) => {
    const config = (input as CalendarViews)[name];
    const isOptionsObject = typeof config === 'object' && config !== null && !Array.isArray(config);

    if (config !== true && !isOptionsObject) {
      throw new Error(`Calendar view "${name}" must be true or an options object`);
    }

    return [name, config === true ? {} : config] as const;
  });

  return Object.fromEntries(entries) as ResolvedCalendarViews<TViews>;
}

function rangeFor(
  view: ViewName,
  date: Temporal.PlainDate,
  timeZone: string,
  weekStartsOn: Weekday,
): VisibleRange {
  if (view === 'month') return getMonthDateRange(date, timeZone, { weekStartsOn });
  if (view === 'week') return getWeekDateRange(date, timeZone, { weekStartsOn });
  return getDayDateRange(date, timeZone);
}

export function getCalendarMetadata(calendar: CalendarController): ControllerMetadata {
  const metadata = controllerMetadata.get(calendar);
  if (!metadata) throw new Error('Unknown calendar controller');
  return metadata;
}

export function createCalendar<const TViews extends NonEmptyCalendarViews>(
  options: CalendarOptions<TViews>,
): CalendarController<TViews> {
  type TView = ConfiguredView<TViews>;

  const configuredViews = Object.keys(options.views) as TView[];
  if (configuredViews.length === 0) {
    throw new Error('Calendar requires at least one configured view');
  }
  for (const name of configuredViews) {
    if (name !== 'month' && name !== 'week' && name !== 'day') {
      throw new Error(`Unsupported calendar view "${name}"`);
    }
  }
  const views = resolveViews(options.views, configuredViews);
  if (views.week) validateTimedView('week', views.week);
  if (views.day) validateTimedView('day', views.day);

  const requestedView = options.view ?? options.defaultView ?? configuredViews[0];
  assertViewConfigured(views, requestedView);

  const timeZone = options.timeZone ?? Temporal.Now.timeZoneId();
  const weekStartsOn = options.weekStartsOn ?? localeWeekStart();
  let date = options.date ?? Temporal.Now.zonedDateTimeISO(timeZone).toPlainDate();
  let view = requestedView as TView;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const calendar: CalendarController<TViews> = {
    get date() {
      return date;
    },
    get view() {
      return view;
    },
    get views() {
      return views;
    },
    get visibleRange() {
      return rangeFor(view, date, timeZone, weekStartsOn);
    },
    title(locales, formatOptions) {
      if (view === 'month') {
        return date.toLocaleString(locales, {
          month: 'long',
          year: 'numeric',
          ...formatOptions,
        });
      }
      if (view === 'week') {
        const range = getWeekDateRange(date, timeZone, { weekStartsOn });
        const start = range.start.toPlainDate().toLocaleString(locales, {
          month: 'short',
          day: 'numeric',
          ...formatOptions,
        });
        const end = range.end
          .subtract({ days: 1 })
          .toPlainDate()
          .toLocaleString(locales, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            ...formatOptions,
          });
        return `${start} - ${end}`;
      }
      return date.toLocaleString(locales, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        ...formatOptions,
      });
    },
    setDate(nextDate) {
      if (date.equals(nextDate)) return;
      date = nextDate;
      notify();
    },
    setView(nextView) {
      assertViewConfigured(views, nextView);
      if (view === nextView) return;
      view = nextView as TView;
      notify();
    },
    next() {
      date = date.add(
        view === 'month' ? { months: 1 } : view === 'week' ? { weeks: 1 } : { days: 1 },
      );
      notify();
    },
    previous() {
      date = date.subtract(
        view === 'month' ? { months: 1 } : view === 'week' ? { weeks: 1 } : { days: 1 },
      );
      notify();
    },
    today() {
      const nextDate = Temporal.Now.zonedDateTimeISO(timeZone).toPlainDate();
      if (date.equals(nextDate)) return;
      date = nextDate;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  controllerMetadata.set(calendar, { timeZone, weekStartsOn });
  return calendar;
}
