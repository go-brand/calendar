import type { Temporal } from '@js-temporal/polyfill';

export type ViewName = 'month' | 'week' | 'day';
/** Temporal.PlainDate.dayOfWeek values: Monday = 1 through Sunday = 7. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type TimedViewConfig = {
  dayStart?: Temporal.PlainTime;
  dayEnd?: Temporal.PlainTime;
  slotDuration?: Temporal.Duration;
};

export type MonthViewConfig = Record<string, never>;

export type ViewConfig = {
  month: true | MonthViewConfig;
  week: true | TimedViewConfig;
  day: true | TimedViewConfig;
};

export type CalendarViews = Partial<ViewConfig>;

export type NonEmptyCalendarViews = {
  [TName in ViewName]: Record<TName, ViewConfig[TName]> & Partial<ViewConfig>;
}[ViewName];

export type ConfiguredView<TViews extends NonEmptyCalendarViews> = Extract<keyof TViews, ViewName>;

export type ResolvedViewConfig = {
  month: MonthViewConfig;
  week: TimedViewConfig;
  day: TimedViewConfig;
};

export type ResolvedCalendarViews<TViews extends NonEmptyCalendarViews> = Readonly<{
  [TName in ConfiguredView<TViews>]: ResolvedViewConfig[TName];
}>;

export type VisibleRange = {
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
};

export type CalendarOptions<TViews extends NonEmptyCalendarViews> = {
  views: TViews;
  date?: Temporal.PlainDate;
  view?: ConfiguredView<TViews>;
  defaultView?: ConfiguredView<TViews>;
  timeZone?: string;
  weekStartsOn?: Weekday;
};

export type CalendarController<TViews extends NonEmptyCalendarViews = NonEmptyCalendarViews> = {
  readonly date: Temporal.PlainDate;
  readonly view: ConfiguredView<TViews>;
  readonly viewNames: readonly ConfiguredView<TViews>[];
  readonly views: ResolvedCalendarViews<TViews>;
  readonly visibleRange: VisibleRange;
  title(
    locales?: Temporal.LocalesArgument,
    options?: globalThis.Intl.DateTimeFormatOptions,
  ): string;
  setDate(date: Temporal.PlainDate): void;
  setView(view: ConfiguredView<TViews>): void;
  next(): void;
  previous(): void;
  today(): void;
  subscribe(listener: () => void): () => void;
};

export type CalendarDay<TItem = never> = {
  id: string;
  date: Temporal.PlainDate;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: TItem[];
};

export type CalendarWeek<TItem = never> = CalendarDay<TItem>[];

export type MonthView<TItem = never> = {
  name: 'month';
  /** @deprecated Use `name`. */
  view: 'month';
  weeks: CalendarWeek<TItem>[];
  month: Temporal.PlainYearMonth;
};

export type CalendarMonth<TItem = never> = MonthView<TItem>;

export type TimeSlot<TItem = never> = {
  id: string;
  hour: number;
  minute: number;
  time: Temporal.PlainTime;
  items: TItem[];
};

export type WeekDay<TItem = never> = {
  id: string;
  date: Temporal.PlainDate;
  isToday: boolean;
  items: TItem[];
  timeSlots: TimeSlot<TItem>[];
};

export type WeekView<TItem = never> = {
  name: 'week';
  /** @deprecated Use `name`. */
  view: 'week';
  days: WeekDay<TItem>[];
  weekStart: Temporal.PlainDate;
  weekEnd: Temporal.PlainDate;
};

export type CalendarWeekView<TItem = never> = {
  name: 'week';
  /** @deprecated Use `name`. */
  view: 'week';
  days: Array<Omit<WeekDay<TItem>, 'timeSlots'> & { timeSlots?: TimeSlot<TItem>[] }>;
  weekStart: Temporal.PlainDate;
  weekEnd: Temporal.PlainDate;
};

export type DayView<TItem = never> = {
  name: 'day';
  /** @deprecated Use `name`. */
  view: 'day';
  id: string;
  date: Temporal.PlainDate;
  isToday: boolean;
  timeSlots: TimeSlot<TItem>[];
  items: TItem[];
};

export type CalendarDayView<TItem = never> = DayView<TItem>;

export type ViewModel<TName extends ViewName, TItem> = {
  month: MonthView<TItem>;
  week: WeekView<TItem>;
  day: DayView<TItem>;
}[TName];

export type ActiveView<TViews extends NonEmptyCalendarViews, TItem> = ViewModel<
  ConfiguredView<TViews>,
  TItem
>;

export type ProjectionData<TItem> =
  | {
      items: readonly TItem[];
      getDate: (item: TItem) => Temporal.PlainDate;
      getStart?: (item: TItem) => Temporal.ZonedDateTime;
    }
  | {
      items?: undefined;
      getDate?: undefined;
      getStart?: undefined;
    };

// Internal legacy shapes remain available to the pre-v1 pure-function tests.
// They are intentionally not re-exported from the package entrypoint.
export type CalendarAccessor<TItem> = {
  getDate: (item: TItem) => Temporal.PlainDate;
  getStart?: (item: TItem) => Temporal.ZonedDateTime;
  getEnd?: (item: TItem) => Temporal.ZonedDateTime;
};

export type MonthViewOptions<TItem> = {
  accessor: CalendarAccessor<TItem>;
  weekStartsOn?: Weekday;
};

export type WeekViewOptions<TItem> = {
  accessor: CalendarAccessor<TItem>;
  weekStartsOn?: Weekday;
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
