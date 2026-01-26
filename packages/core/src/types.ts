import type { Temporal } from '@js-temporal/polyfill';

// Accessor system
export type CalendarAccessor<TItem> = {
  getDate: (item: TItem) => Temporal.PlainDate;
  getStart?: (item: TItem) => Temporal.ZonedDateTime;
  getEnd?: (item: TItem) => Temporal.ZonedDateTime;
};

// Calendar types
export type CalendarDay<TItem = unknown> = {
  date: Temporal.PlainDate;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: TItem[];
};

export type CalendarWeek<TItem = unknown> = CalendarDay<TItem>[];

export type CalendarMonth<TItem = unknown> = {
  weeks: CalendarWeek<TItem>[];
  month: Temporal.PlainYearMonth;
};

// Week view types
export type WeekDay<TItem = unknown> = {
  date: Temporal.PlainDate;
  isToday: boolean;
  items: TItem[];
  timeSlots?: TimeSlot<TItem>[];
};

export type CalendarWeekView<TItem = unknown> = {
  days: WeekDay<TItem>[];
  weekStart: Temporal.PlainDate;
  weekEnd: Temporal.PlainDate;
};

// Day view types
export type TimeSlot<TItem = unknown> = {
  hour: number;
  minute: number;
  time: Temporal.PlainTime;
  items: TItem[];
};

export type CalendarDayView<TItem = unknown> = {
  date: Temporal.PlainDate;
  isToday: boolean;
  timeSlots: TimeSlot<TItem>[];
  items: TItem[];
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
export type MonthViewOptions<TItem> = {
  accessor: CalendarAccessor<TItem>;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

export type WeekViewOptions<TItem> = {
  accessor: CalendarAccessor<TItem>;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startHour?: number;
  endHour?: number;
  slotDuration?: number;
};

export type DayViewOptions<TItem> = {
  accessor: CalendarAccessor<TItem>;
  startHour?: number;
  endHour?: number;
  slotDuration?: number;
};

export type CalendarViewOptions<TItem> = {
  month?: MonthViewOptions<TItem>;
  week?: WeekViewOptions<TItem>;
  day?: DayViewOptions<TItem>;
};

export type CalendarOptions<TItem> = {
  data: TItem[];
  views: CalendarViewOptions<TItem>;
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
type MonthMethods<TItem, TOptions> = HasView<TOptions, 'month'> extends true
  ? {
      getMonth(): CalendarMonth<TItem>;
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

type WeekMethods<TItem, TOptions> = HasView<TOptions, 'week'> extends true
  ? {
      getWeek(): CalendarWeekView<TItem>;
      nextWeek(): void;
      previousWeek(): void;
    }
  : {
      getWeek?: never;
      nextWeek?: never;
      previousWeek?: never;
    };

type DayMethods<TItem, TOptions> = HasView<TOptions, 'day'> extends true
  ? {
      getDay(): CalendarDayView<TItem>;
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
  // If view is omitted, formats title for currentView
  getTitle(
    view?: ValidViews<Options>,
    locales?: Temporal.LocalesArgument,
    options?: globalThis.Intl.DateTimeFormatOptions
  ): string;

  // State management
  getState(): CalendarState;
  setState(
    updater: CalendarState | ((old: CalendarState) => Partial<CalendarState>)
  ): void;

  // Navigation - shared
  goToToday(): void;
  goToDate(date: Temporal.PlainDate): void;

  // View-aware navigation shortcuts (only for configured views)
  // If view is omitted, navigates based on currentView
  next(view?: ValidViews<Options>): void;
  previous(view?: ValidViews<Options>): void;

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

  // Type predicates for runtime view checking
  hasMonthView(): boolean;
  hasWeekView(): boolean;
  hasDayView(): boolean;
};

// Helper to convert views-only to full CalendarOptions
type ViewsToOptions<TItem, TViews extends CalendarViewOptions<TItem>> = {
  data: TItem[];
  views: TViews;
};

// Unified calendar type with conditional methods
// Can be called as:
//   Calendar<TItem> - generic calendar with all views possible
//   Calendar<TItem, typeof views> - calendar with just views object (data is inferred as TItem[])
//   Calendar<TItem, CalendarOptions<TItem>> - calendar with full options
export type Calendar<
  TItem,
  TOptionsOrViews = CalendarOptions<TItem>
> = TOptionsOrViews extends CalendarOptions<TItem>
  ? BaseCalendarMethods<TOptionsOrViews> &
      MonthMethods<TItem, TOptionsOrViews> &
      WeekMethods<TItem, TOptionsOrViews> &
      DayMethods<TItem, TOptionsOrViews>
  : TOptionsOrViews extends CalendarViewOptions<TItem>
  ? BaseCalendarMethods<ViewsToOptions<TItem, TOptionsOrViews>> &
      MonthMethods<TItem, ViewsToOptions<TItem, TOptionsOrViews>> &
      WeekMethods<TItem, ViewsToOptions<TItem, TOptionsOrViews>> &
      DayMethods<TItem, ViewsToOptions<TItem, TOptionsOrViews>>
  : BaseCalendarMethods<CalendarOptions<TItem>> &
      MonthMethods<TItem, CalendarOptions<TItem>> &
      WeekMethods<TItem, CalendarOptions<TItem>> &
      DayMethods<TItem, CalendarOptions<TItem>>;

// createCalendarViews utility types
export type InferViewNames<V extends CalendarViewOptions<unknown>> = keyof V &
  string;

export type InferViewConfig<
  V extends CalendarViewOptions<unknown>,
  Name extends keyof V
> = V[Name] extends infer Config ? { name: Name; config: Config } : never;

// ============================================================================
// Utility Types for Type Extraction and Component Props
// ============================================================================

/**
 * Extract the item type from a Calendar type
 * @example type Item = CalendarItemType<typeof calendar>; // Post
 */
export type CalendarItemType<C extends Calendar<any, any>> =
  C extends Calendar<infer TItem, any> ? TItem : never;

/**
 * Extract the views configuration from a Calendar type
 * @example type Views = CalendarViewsConfig<typeof calendar>;
 */
export type CalendarViewsConfig<C extends Calendar<any, any>> =
  C extends Calendar<any, infer TOptions>
    ? TOptions extends { views: infer V }
      ? V
      : TOptions extends CalendarViewOptions<any>
      ? TOptions
      : never
    : never;

/**
 * Check if a Calendar has a specific view configured
 * @example type HasMonth = HasViewType<typeof calendar, 'month'>; // true | false
 */
export type HasViewType<
  C extends Calendar<any, any>,
  V extends 'month' | 'week' | 'day'
> = C extends Calendar<any, infer TOptions> ? HasView<TOptions, V> : false;

/**
 * Extract valid view names as a union from a Calendar
 * @example type Views = ValidViewNames<typeof calendar>; // 'month' | 'week'
 */
export type ValidViewNames<C extends Calendar<any, any>> =
  C extends Calendar<any, infer TOptions> ? ValidViews<TOptions> : never;

/**
 * Extract the item type from CalendarOptions before creating a calendar
 * @example type Item = ItemTypeFromOptions<typeof options>; // Post
 */
export type ItemTypeFromOptions<O extends CalendarOptions<any>> =
  O extends CalendarOptions<infer TItem> ? TItem : never;

// ============================================================================
// Component Helper Types
// ============================================================================

/**
 * Base props for components that receive a Calendar
 * @example
 * function MyComponent<C extends Calendar<any, any>>(
 *   props: CalendarComponentProps<C>
 * ) { ... }
 */
export type CalendarComponentProps<C extends Calendar<any, any>> = {
  calendar: C;
};

/**
 * Require that a Calendar has month view configured
 * @example
 * function MonthView<C extends Calendar<any, any>>(
 *   props: { calendar: RequireMonthView<C> }
 * ) {
 *   // calendar.getMonth() is guaranteed to exist
 * }
 */
export type RequireMonthView<C extends Calendar<any, any>> =
  HasViewType<C, 'month'> extends true ? C : never;

/**
 * Require that a Calendar has week view configured
 */
export type RequireWeekView<C extends Calendar<any, any>> =
  HasViewType<C, 'week'> extends true ? C : never;

/**
 * Require that a Calendar has day view configured
 */
export type RequireDayView<C extends Calendar<any, any>> =
  HasViewType<C, 'day'> extends true ? C : never;
