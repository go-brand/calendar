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
  views: CalendarViewOptions<TItem>;
  timeZone?: 'UTC' | string; // Optional IANA timezone identifier (e.g., 'Europe/Madrid'). Defaults to system timezone.
  state?: Partial<CalendarState>;
  onStateChange?: (state: CalendarState) => void;
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
      getMonth(data?: TItem[]): CalendarMonth<TItem>;
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
      getWeek(data?: TItem[]): CalendarWeekView<TItem>;
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
      getDay(data?: TItem[]): CalendarDayView<TItem>;
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

  // Get date range for a specific view (useful for dual view scenarios)
  // If view is omitted, returns dateRange for currentView
  getDateRange(view?: ValidViews<Options>): DateRange;

  // Options and store
  options: Options;
  setOptions(updater: (old: Options) => Options): void;
  store: import('@tanstack/store').Store<CalendarState>;

  // Type predicates for runtime view checking
  hasMonthView(): boolean;
  hasWeekView(): boolean;
  hasDayView(): boolean;
};

/**
 * Unified calendar type with conditional methods based on configured views.
 *
 * @example
 * // Calendar with specific options - methods are conditional
 * const calendar = createCalendar<Post, typeof options>(options);
 * calendar.getMonth([]); // Only available if month view configured
 *
 * @example
 * // Generic calendar type - all methods available
 * type AnyPostCalendar = Calendar<Post>;
 */
export type Calendar<
  TItem,
  TOptions extends CalendarOptions<TItem> = CalendarOptions<TItem>
> = BaseCalendarMethods<TOptions> &
  MonthMethods<TItem, TOptions> &
  WeekMethods<TItem, TOptions> &
  DayMethods<TItem, TOptions>;

// ============================================================================
// Utility Types for Type Extraction and Component Props
// ============================================================================

/**
 * Calendar instance with all view methods available and typed items.
 * Use this for contexts where the specific view configuration is unknown at compile time,
 * but you still want type-safe item data.
 *
 * @example
 * // In React context - store with unknown, consume with specific type
 * const context = createContext<CalendarInstance<unknown> | null>(null);
 *
 * // Consumer gets typed data
 * function useCalendar<TItem>(): CalendarInstance<TItem> {
 *   return useContext(context) as CalendarInstance<TItem>;
 * }
 */
export type CalendarInstance<TItem = unknown> = {
  // View methods (always present for dynamic access, typed with TItem)
  getMonth(data?: TItem[]): CalendarMonth<TItem>;
  getWeek(data?: TItem[]): CalendarWeekView<TItem>;
  getDay(data?: TItem[]): CalendarDayView<TItem>;

  // Base methods
  getTitle(view?: ViewType, locales?: Temporal.LocalesArgument, options?: globalThis.Intl.DateTimeFormatOptions): string;
  getState(): CalendarState;
  setState(updater: CalendarState | ((old: CalendarState) => Partial<CalendarState>)): void;
  goToToday(): void;
  goToDate(date: Temporal.PlainDate): void;
  next(view?: ViewType): void;
  previous(view?: ViewType): void;

  // View management
  views: ReadonlyArray<string>;
  currentView: string;
  setCurrentView(view: string): void;

  // Date range
  dateRange: DateRange;
  getDateRange(view?: ViewType): DateRange;

  // Options and store
  options: CalendarOptions<TItem>;
  setOptions(updater: (old: CalendarOptions<TItem>) => CalendarOptions<TItem>): void;
  store: import('@tanstack/store').Store<CalendarState>;

  // View navigation
  nextMonth(): void;
  previousMonth(): void;
  goToMonth(year: number, month: number): void;
  nextWeek(): void;
  previousWeek(): void;
  nextDay(): void;
  previousDay(): void;

  // Type predicates
  hasMonthView(): boolean;
  hasWeekView(): boolean;
  hasDayView(): boolean;
};


/**
 * Extract the item type from a Calendar's options
 * @example type Item = CalendarItemType<typeof calendar>; // Post
 */
export type CalendarItemType<C extends CalendarInstance> =
  C['options'] extends CalendarOptions<infer TItem> ? TItem : never;

/**
 * Extract the views configuration from a Calendar type
 * @example type Views = CalendarViewsConfig<typeof calendar>;
 */
export type CalendarViewsConfig<C extends CalendarInstance> =
  C['options'] extends { views: infer V } ? V : never;

/**
 * Check if a Calendar has a specific view configured
 * @example type HasMonth = HasViewType<typeof calendar, 'month'>; // true | false
 */
export type HasViewType<
  C extends CalendarInstance,
  V extends 'month' | 'week' | 'day'
> = C['options'] extends CalendarOptions<infer TItem>
  ? HasView<C['options'], V>
  : false;

/**
 * Extract valid view names as a union from a Calendar
 * @example type Views = ValidViewNames<typeof calendar>; // 'month' | 'week'
 */
export type ValidViewNames<C extends CalendarInstance> =
  C['options'] extends CalendarOptions<infer TItem>
    ? ValidViews<C['options']>
    : never;

// ============================================================================
// Component Helper Types
// ============================================================================

/**
 * Base props for components that receive a Calendar
 * @example
 * function MyComponent<C extends CalendarInstance>(
 *   props: CalendarComponentProps<C>
 * ) { ... }
 */
export type CalendarComponentProps<C extends CalendarInstance> = {
  calendar: C;
};

/**
 * Require that a Calendar has month view configured
 * @example
 * function MonthView<C extends CalendarInstance>(
 *   props: { calendar: RequireMonthView<C> }
 * ) {
 *   // calendar.getMonth() is guaranteed to exist
 * }
 */
export type RequireMonthView<C extends CalendarInstance> =
  HasViewType<C, 'month'> extends true ? C : never;

/**
 * Require that a Calendar has week view configured
 */
export type RequireWeekView<C extends CalendarInstance> =
  HasViewType<C, 'week'> extends true ? C : never;

/**
 * Require that a Calendar has day view configured
 */
export type RequireDayView<C extends CalendarInstance> =
  HasViewType<C, 'day'> extends true ? C : never;

// ============================================================================
// View Result Types (for useView hook)
// ============================================================================

/**
 * Built-in view types
 */
export type ViewType = 'month' | 'week' | 'day';

/**
 * Discriminated union of all view results
 */
export type ViewResult<TItem> =
  | { type: 'month'; data: CalendarMonth<TItem> }
  | { type: 'week'; data: CalendarWeekView<TItem> }
  | { type: 'day'; data: CalendarDayView<TItem> };

/**
 * Conditional type that narrows ViewResult based on view name
 * - If V is a specific view type, returns that specific result
 * - If V is undefined, returns the full discriminated union
 */
export type ViewResultFor<TItem, V extends ViewType | undefined> =
  V extends 'month' ? { type: 'month'; data: CalendarMonth<TItem> } :
  V extends 'week' ? { type: 'week'; data: CalendarWeekView<TItem> } :
  V extends 'day' ? { type: 'day'; data: CalendarDayView<TItem> } :
  ViewResult<TItem>;
