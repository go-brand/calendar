import type { Temporal } from '@js-temporal/polyfill';

// Accessor system
export type CalendarAccessor<T> = {
  getDate: (item: T) => Temporal.PlainDate;
  getStart?: (item: T) => Temporal.ZonedDateTime;
  getEnd?: (item: T) => Temporal.ZonedDateTime;
};

// Calendar types
export type CalendarDay<T = unknown> = {
  date: Temporal.PlainDate;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: T[];
};

export type CalendarWeek<T = unknown> = CalendarDay<T>[];

export type CalendarMonth<T = unknown> = {
  weeks: CalendarWeek<T>[];
  month: Temporal.PlainYearMonth;
};

// Week view types
export type WeekDay<T = unknown> = {
  date: Temporal.PlainDate;
  isToday: boolean;
  items: T[];
  timeSlots?: TimeSlot<T>[];
};

export type CalendarWeekView<T = unknown> = {
  days: WeekDay<T>[];
  weekStart: Temporal.PlainDate;
  weekEnd: Temporal.PlainDate;
};

// Day view types
export type TimeSlot<T = unknown> = {
  hour: number;
  minute: number;
  time: Temporal.PlainTime;
  items: T[];
};

export type CalendarDayView<T = unknown> = {
  date: Temporal.PlainDate;
  isToday: boolean;
  timeSlots: TimeSlot<T>[];
  items: T[];
};

// Date range with ZonedDateTime boundaries for timezone-aware queries
export type DateRange = {
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
};

// Updater pattern (following TanStack Table)
export type Updater<T> = T | ((old: T) => T);

// State types
export type CalendarState = {
  referenceDate: Temporal.PlainDate;
  currentView?: string; // String to allow custom view names
  dateRange: DateRange; // Computed ZonedDateTime range for the calendar's timezone
};


// View options types
export type MonthViewOptions<T> = {
  accessor: CalendarAccessor<T>;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

export type WeekViewOptions<T> = {
  accessor: CalendarAccessor<T>;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startHour?: number;
  endHour?: number;
  slotDuration?: number;
};

export type DayViewOptions<T> = {
  accessor: CalendarAccessor<T>;
  startHour?: number;
  endHour?: number;
  slotDuration?: number;
};

export type CalendarViewOptions<T> = {
  month?: MonthViewOptions<T>;
  week?: WeekViewOptions<T>;
  day?: DayViewOptions<T>;
};

export type CalendarOptions<T> = {
  data: T[];
  views: CalendarViewOptions<T>;
  timeZone?: 'UTC' | string; // Optional IANA timezone identifier (e.g., 'Europe/Madrid'). Defaults to system timezone.
  state?: Partial<CalendarState>;
  onStateChange?: (updater: Updater<CalendarState>) => void;
};

// Helper type to check if a view is configured
type HasView<Options, View extends 'month' | 'week' | 'day'> = Options extends {
  views: infer V;
}
  ? V extends Record<View, unknown>
    ? V[View] extends undefined
      ? false
      : true
    : false
  : false;

// Conditional methods based on configured views
type MonthMethods<T, Options> = HasView<Options, 'month'> extends true
  ? {
      getMonth(): CalendarMonth<T>;
      nextMonth(): void;
      previousMonth(): void;
      goToMonth(year: number, month: number): void;
    }
  : {
      getMonth?: never;
      nextMonth?: never;
      previousMonth?: never;
      goToMonth?: never;
    };

type WeekMethods<T, Options> = HasView<Options, 'week'> extends true
  ? {
      getWeek(): CalendarWeekView<T>;
      nextWeek(): void;
      previousWeek(): void;
    }
  : {
      getWeek?: never;
      nextWeek?: never;
      previousWeek?: never;
    };

type DayMethods<T, Options> = HasView<Options, 'day'> extends true
  ? {
      getDay(): CalendarDayView<T>;
      nextDay(): void;
      previousDay(): void;
    }
  : {
      getDay?: never;
      nextDay?: never;
      previousDay?: never;
    };

// Helper to build valid view union - extract keys from views object
type ValidViews<Options> = Options extends { views: infer V }
  ? keyof V & string
  : never;

// Base calendar methods that are always available
type BaseCalendarMethods<Options> = {
  // View-aware title formatter (only for configured views)
  getTitle(
    view: ValidViews<Options>,
    locales?: Temporal.LocalesArgument,
    options?: globalThis.Intl.DateTimeFormatOptions
  ): string;

  // State management
  getState(): CalendarState;
  setState(updater: CalendarState | ((old: CalendarState) => Partial<CalendarState>)): void;

  // Navigation - shared
  goToToday(): void;
  goToDate(date: Temporal.PlainDate): void;

  // View-aware navigation shortcuts (only for configured views)
  next(view: ValidViews<Options>): void;
  previous(view: ValidViews<Options>): void;

  // View management
  views: ReadonlyArray<ValidViews<Options>>;
  currentView: ValidViews<Options>;
  setCurrentView(view: ValidViews<Options>): void;

  // Date range (computed from currentView, referenceDate, and timeZone)
  dateRange: DateRange;

  // Options and store
  options: Options;
  setOptions(updater: (old: Options) => Options): void;
  store: import('@tanstack/store').Store<CalendarState>;
};

// Helper to convert views-only to full CalendarOptions
type ViewsToOptions<T, V extends CalendarViewOptions<T>> = {
  data: T[];
  views: V;
};

// Unified calendar type with conditional methods
// Can be called as:
//   Calendar<T> - generic calendar with all views possible
//   Calendar<T, typeof views> - calendar with just views object (data is inferred as T[])
//   Calendar<T, CalendarOptions<T>> - calendar with full options
export type Calendar<
  T,
  OptionsOrViews = CalendarOptions<T>
> = OptionsOrViews extends CalendarOptions<T>
  ? BaseCalendarMethods<OptionsOrViews> &
      MonthMethods<T, OptionsOrViews> &
      WeekMethods<T, OptionsOrViews> &
      DayMethods<T, OptionsOrViews>
  : OptionsOrViews extends CalendarViewOptions<T>
  ? BaseCalendarMethods<ViewsToOptions<T, OptionsOrViews>> &
      MonthMethods<T, ViewsToOptions<T, OptionsOrViews>> &
      WeekMethods<T, ViewsToOptions<T, OptionsOrViews>> &
      DayMethods<T, ViewsToOptions<T, OptionsOrViews>>
  : BaseCalendarMethods<CalendarOptions<T>> &
      MonthMethods<T, CalendarOptions<T>> &
      WeekMethods<T, CalendarOptions<T>> &
      DayMethods<T, CalendarOptions<T>>;

// createCalendarViews utility types
export type InferViewNames<V extends CalendarViewOptions<unknown>> = keyof V & string;

export type InferViewConfig<
  V extends CalendarViewOptions<unknown>,
  Name extends keyof V
> = V[Name] extends infer Config ? { name: Name; config: Config } : never;
