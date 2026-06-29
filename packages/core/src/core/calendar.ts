import { Temporal } from "@js-temporal/polyfill";
import { Store } from "@tanstack/store";
import {
  functionalUpdate,
  nextMonth,
  previousMonth,
  nextWeek,
  previousWeek,
  nextDay,
  previousDay,
} from "../utils";
import { buildMonth } from "../utils/buildMonth";
import { buildWeek } from "../utils/buildWeek";
import { buildDay } from "../utils/buildDay";
import { getMonthDateRange, getWeekDateRange, getDayDateRange } from "../utils/dateRanges";
import type { Calendar, CalendarOptions, CalendarState, DateRange } from "../types";

function computeDateRange(
  view: string,
  referenceDate: Temporal.PlainDate,
  timeZone: string,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1,
): DateRange {
  if (view === "month") {
    return getMonthDateRange(referenceDate, timeZone, { weekStartsOn });
  }
  if (view === "week") {
    return getWeekDateRange(referenceDate, timeZone, { weekStartsOn });
  }
  return getDayDateRange(referenceDate, timeZone);
}

export function createCalendar<
  TItem,
  TOptions extends CalendarOptions<TItem> = CalendarOptions<TItem>,
>(options: TOptions): Calendar<TItem, TOptions> {
  type ViewType = keyof TOptions["views"] & string;
  const configuredViews = Object.keys(options.views) as ReadonlyArray<ViewType>;
  const defaultView = configuredViews[0];

  const timeZone = options.timeZone || Temporal.Now.timeZoneId();

  const monthView = options.views.month;
  const weekView = options.views.week;
  const weekStartsOn = monthView?.weekStartsOn ?? weekView?.weekStartsOn ?? 1;

  const initialReferenceDate = options.state?.referenceDate || Temporal.Now.plainDateISO();
  const initialView = options.state?.currentView || defaultView;

  const initialDateRange = computeDateRange(
    initialView as string,
    initialReferenceDate,
    timeZone,
    weekStartsOn,
  );

  const resolvedOptions = {
    state: {
      referenceDate: initialReferenceDate,
      currentView: initialView,
      dateRange: initialDateRange,
    },
    onStateChange: () => {},
    ...options,
  } as TOptions;

  let _options = resolvedOptions;
  const store = new Store<CalendarState>({
    referenceDate: initialReferenceDate,
    currentView: initialView,
    dateRange: initialDateRange,
    ...resolvedOptions.state,
  });

  const getMonthImpl = (data: TItem[] = []) => {
    const state = store.state;
    const { year, month } = state.referenceDate;
    const monthView = _options.views.month;
    if (!monthView) throw new Error("Month view not configured");
    return buildMonth(year, month, {
      weekStartsOn: monthView.weekStartsOn,
      data,
      accessor: monthView.accessor,
    });
  };

  const getWeekImpl = (data: TItem[] = []) => {
    const state = store.state;
    const weekView = _options.views.week;
    if (!weekView) throw new Error("Week view not configured");
    return buildWeek(state.referenceDate, {
      weekStartsOn: weekView.weekStartsOn,
      startHour: weekView.startHour,
      endHour: weekView.endHour,
      slotDuration: weekView.slotDuration,
      data,
      accessor: weekView.accessor,
    });
  };

  const getDayImpl = (data: TItem[] = []) => {
    const state = store.state;
    const dayView = _options.views.day;
    if (!dayView) throw new Error("Day view not configured");
    return buildDay(state.referenceDate, {
      startHour: dayView.startHour,
      endHour: dayView.endHour,
      slotDuration: dayView.slotDuration,
      data,
      accessor: dayView.accessor,
    });
  };

  const setStateImpl = (
    updater: CalendarState | ((old: CalendarState) => Partial<CalendarState>),
  ) => {
    const partialState = typeof updater === "function" ? updater(store.state) : updater;

    const newState = {
      ...store.state,
      ...partialState,
    };

    const currentView = newState.currentView || defaultView;
    const dateRange = computeDateRange(currentView, newState.referenceDate, timeZone, weekStartsOn);

    const stateWithDateRange = {
      ...newState,
      dateRange,
    };

    store.setState(() => stateWithDateRange);

    if (_options.onStateChange) {
      _options.onStateChange(stateWithDateRange);
    }
  };

  const nextMonthImpl = () => {
    setStateImpl((old) => {
      const current = Temporal.PlainYearMonth.from({
        year: old.referenceDate.year,
        month: old.referenceDate.month,
      });
      const next = nextMonth(current);
      return {
        referenceDate: next.toPlainDate({ day: 1 }),
      };
    });
  };

  const previousMonthImpl = () => {
    setStateImpl((old) => {
      const current = Temporal.PlainYearMonth.from({
        year: old.referenceDate.year,
        month: old.referenceDate.month,
      });
      const prev = previousMonth(current);
      return {
        referenceDate: prev.toPlainDate({ day: 1 }),
      };
    });
  };

  const nextWeekImpl = () => {
    setStateImpl((old) => ({
      referenceDate: nextWeek(old.referenceDate),
    }));
  };

  const previousWeekImpl = () => {
    setStateImpl((old) => ({
      referenceDate: previousWeek(old.referenceDate),
    }));
  };

  const nextDayImpl = () => {
    setStateImpl((old) => ({
      referenceDate: nextDay(old.referenceDate),
    }));
  };

  const previousDayImpl = () => {
    setStateImpl((old) => ({
      referenceDate: previousDay(old.referenceDate),
    }));
  };

  const calendar = {
    getMonth: getMonthImpl,
    getWeek: getWeekImpl,
    getDay: getDayImpl,

    getTitle(
      view?: "month" | "week" | "day",
      locales?: Temporal.LocalesArgument,
      options?: globalThis.Intl.DateTimeFormatOptions,
    ): string {
      const effectiveView = view ?? store.state.currentView ?? defaultView;
      switch (effectiveView) {
        case "month": {
          const month = getMonthImpl();
          const date = month.month.toPlainDate({ day: 1 });
          return date.toLocaleString(locales, {
            month: "long",
            year: "numeric",
            ...options,
          });
        }
        case "week": {
          const week = getWeekImpl();
          const startOptions: globalThis.Intl.DateTimeFormatOptions = {
            month: "short" as const,
            day: "numeric" as const,
            ...options,
          };
          const endOptions: globalThis.Intl.DateTimeFormatOptions = {
            month: "short" as const,
            day: "numeric" as const,
            year: "numeric" as const,
            ...options,
          };
          const start = week.weekStart.toLocaleString(locales, startOptions);
          const end = week.weekEnd.toLocaleString(locales, endOptions);
          return `${start} - ${end}`;
        }
        case "day": {
          const day = getDayImpl();
          return day.date.toLocaleString(locales, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            ...options,
          });
        }
        default:
          throw new Error(`Unknown view: ${effectiveView}`);
      }
    },

    getState() {
      return store.state;
    },

    setState: setStateImpl,

    nextMonth: nextMonthImpl,
    previousMonth: previousMonthImpl,

    goToMonth(year: number, month: number) {
      setStateImpl(() => ({
        referenceDate: Temporal.PlainDate.from({ year, month, day: 1 }),
      }));
    },

    nextWeek: nextWeekImpl,
    previousWeek: previousWeekImpl,
    nextDay: nextDayImpl,
    previousDay: previousDayImpl,

    goToToday() {
      setStateImpl(() => ({
        referenceDate: Temporal.Now.plainDateISO(),
      }));
    },

    goToDate(date: Temporal.PlainDate) {
      setStateImpl(() => ({
        referenceDate: date,
      }));
    },

    next(view?: "month" | "week" | "day") {
      const effectiveView = view ?? store.state.currentView ?? defaultView;
      switch (effectiveView) {
        case "month":
          nextMonthImpl();
          break;
        case "week":
          nextWeekImpl();
          break;
        case "day":
          nextDayImpl();
          break;
      }
    },

    previous(view?: "month" | "week" | "day") {
      const effectiveView = view ?? store.state.currentView ?? defaultView;
      switch (effectiveView) {
        case "month":
          previousMonthImpl();
          break;
        case "week":
          previousWeekImpl();
          break;
        case "day":
          previousDayImpl();
          break;
      }
    },

    get views() {
      return configuredViews as ReadonlyArray<ViewType>;
    },

    get currentView() {
      return (store.state.currentView || defaultView) as ViewType;
    },

    setCurrentView(view: ViewType) {
      setStateImpl((old) => ({
        ...old,
        currentView: view as string,
      }));
    },

    get dateRange() {
      return store.state.dateRange;
    },

    getDateRange(view?: "month" | "week" | "day") {
      const effectiveView = view ?? store.state.currentView ?? defaultView;
      return computeDateRange(effectiveView, store.state.referenceDate, timeZone, weekStartsOn);
    },

    get options() {
      return _options;
    },

    setOptions(updater: (old: TOptions) => TOptions) {
      _options = functionalUpdate(updater, _options);
    },

    // Type predicates for runtime view checking
    hasMonthView() {
      return "month" in _options.views && _options.views.month !== undefined;
    },

    hasWeekView() {
      return "week" in _options.views && _options.views.week !== undefined;
    },

    hasDayView() {
      return "day" in _options.views && _options.views.day !== undefined;
    },

    store,
  } as unknown as Calendar<TItem, TOptions>;

  return calendar;
}
