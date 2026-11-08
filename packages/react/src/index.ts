'use client';

import { Temporal } from '@js-temporal/polyfill';
import {
  buildDayView,
  buildMonthView,
  buildWeekView,
  createCalendar,
} from '@gobrand/calendar-core';
import type {
  ActiveView,
  CalendarController,
  ConfiguredView,
  DayView,
  MonthView,
  NonEmptyCalendarViews,
  ProjectionData,
  ResolvedViewConfig,
  TimedViewConfig,
  ViewModel,
  ViewName,
  VisibleRange,
  WeekView,
  Weekday,
} from '@gobrand/calendar-core';
import {
  createContext,
  createElement,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';

export * from '@gobrand/calendar-core';

export type ContextCalendarController = {
  readonly date: Temporal.PlainDate;
  readonly view: ViewName;
  readonly viewNames: readonly ViewName[];
  readonly views: Readonly<Partial<ResolvedViewConfig>>;
  readonly visibleRange: VisibleRange;
  title(
    locales?: Temporal.LocalesArgument,
    options?: globalThis.Intl.DateTimeFormatOptions,
  ): string;
  setDate(date: Temporal.PlainDate): void;
  setView(view: ViewName): void;
  next(): void;
  previous(): void;
  today(): void;
  subscribe(listener: () => void): () => void;
};

type AnyCalendarController = ContextCalendarController;

type ReactCalendarOptions<TViews extends NonEmptyCalendarViews> = {
  views: TViews;
  timeZone?: string;
  weekStartsOn?: Weekday;
  date?: Temporal.PlainDate;
  onDateChange?: (date: Temporal.PlainDate) => void;
  defaultDate?: Temporal.PlainDate;
  view?: ConfiguredView<TViews>;
  onViewChange?: (view: ConfiguredView<TViews>) => void;
  defaultView?: ConfiguredView<TViews>;
};

type CalendarData<TItem> = {
  items: readonly TItem[];
  getDate: (item: TItem) => Temporal.PlainDate;
  getStart?: (item: TItem) => Temporal.ZonedDateTime;
};

type DataFreeCalendar = {
  items?: undefined;
  getDate?: undefined;
  getStart?: undefined;
};

export type CalendarWithActiveView<
  TViews extends NonEmptyCalendarViews,
  TItem,
> = CalendarController<TViews> & {
  activeView: ActiveView<TViews, TItem>;
};

const CalendarContext = createContext<AnyCalendarController | null>(null);
const calendarAliases = new WeakMap<object, AnyCalendarController>();
const ownedCalendars = new WeakSet<object>();
const noSubscription = () => () => {};
const constantSnapshot = () => '';

function useCalendarSubscription(calendar: AnyCalendarController | null) {
  const source = useMemo(() => {
    // Hook-owned state is synchronized by useCreateCalendar. Never observe its
    // transient controlled proposals through an external-store snapshot.
    if (!calendar || ownedCalendars.has(calendar)) {
      return { subscribe: noSubscription, snapshot: constantSnapshot };
    }
    return {
      subscribe: (listener: () => void) => calendar.subscribe(listener),
      snapshot: () => `${calendar.date.toString()}|${calendar.view}`,
    };
  }, [calendar]);
  useSyncExternalStore(source.subscribe, source.snapshot, source.snapshot);
}

function unwrapCalendar(calendar: AnyCalendarController) {
  return calendarAliases.get(calendar) ?? calendar;
}

function viewSignature(views: NonEmptyCalendarViews) {
  return (['month', 'week', 'day'] as const)
    .flatMap((name) => {
      const config = views[name];
      if (!config) return [];
      if (config === true) return [name, '', '', ''];
      const timed = config as TimedViewConfig;
      return [
        name,
        timed.dayStart?.toString() ?? '',
        timed.dayEnd?.toString() ?? '',
        timed.slotDuration?.toString() ?? '',
      ];
    })
    .join('|');
}

function projectActiveView<TViews extends NonEmptyCalendarViews, TItem>(
  calendar: CalendarController<TViews>,
  data: CalendarData<TItem>,
): ActiveView<TViews, TItem> {
  if (calendar.view === 'month') {
    return buildMonthView({ calendar: calendar as never, ...data }) as ActiveView<TViews, TItem>;
  }
  if (calendar.view === 'week') {
    return buildWeekView({ calendar: calendar as never, ...data }) as ActiveView<TViews, TItem>;
  }
  return buildDayView({ calendar: calendar as never, ...data }) as ActiveView<TViews, TItem>;
}

export function useCreateCalendar<const TViews extends NonEmptyCalendarViews, TItem>(
  options: ReactCalendarOptions<TViews> & CalendarData<TItem>,
): CalendarWithActiveView<TViews, TItem>;
export function useCreateCalendar<const TViews extends NonEmptyCalendarViews>(
  options: ReactCalendarOptions<TViews> & DataFreeCalendar,
): CalendarController<TViews>;
export function useCreateCalendar<const TViews extends NonEmptyCalendarViews, TItem>(
  options: ReactCalendarOptions<TViews> & (CalendarData<TItem> | DataFreeCalendar),
): CalendarController<TViews> | CalendarWithActiveView<TViews, TItem> {
  const {
    date: controlledDate,
    defaultDate,
    defaultView,
    onDateChange,
    onViewChange,
    view: controlledView,
    views,
    weekStartsOn,
  } = options;
  const timeZone = options.timeZone ?? Temporal.Now.timeZoneId();
  const configuredViews = Object.keys(views) as ConfiguredView<TViews>[];
  const initialView = defaultView ?? configuredViews[0];
  const [uncontrolledDate, setUncontrolledDate] = useState(
    () => defaultDate ?? Temporal.Now.zonedDateTimeISO(timeZone).toPlainDate(),
  );
  const [uncontrolledView, setUncontrolledView] = useState(initialView);
  const [revision, forceControlledReset] = useReducer((value: number) => value + 1, 0);

  const resolvedDate = controlledDate ?? uncontrolledDate;
  const fallbackView = defaultView ?? configuredViews[0];
  const resolvedView =
    controlledView ??
    (uncontrolledView && uncontrolledView in views ? uncontrolledView : fallbackView);
  const signature = viewSignature(views);
  const dateSignature = resolvedDate.toString();
  const controlledRevision =
    controlledDate !== undefined || controlledView !== undefined ? revision : 0;

  const calendar = useMemo(
    () => {
      const created = createCalendar({
        views,
        date: resolvedDate,
        view: resolvedView,
        timeZone,
        weekStartsOn,
      });
      ownedCalendars.add(created);
      return created;
    },
    // View geometry and Temporal values use stable value signatures intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature, dateSignature, resolvedView, timeZone, weekStartsOn, controlledRevision],
  );

  useLayoutEffect(() => {
    let previousDate = calendar.date;
    let previousView = calendar.view;

    return calendar.subscribe(() => {
      const dateChanged = !calendar.date.equals(previousDate);
      const viewChanged = calendar.view !== previousView;

      if (dateChanged) {
        previousDate = calendar.date;
        if (controlledDate === undefined) setUncontrolledDate(calendar.date);
        else onDateChange?.(calendar.date);
      }
      if (viewChanged) {
        previousView = calendar.view;
        if (controlledView === undefined) setUncontrolledView(calendar.view);
        else onViewChange?.(calendar.view);
      }
      if (
        (dateChanged && controlledDate !== undefined) ||
        (viewChanged && controlledView !== undefined)
      ) {
        forceControlledReset();
      }
    });
  }, [calendar, controlledDate, controlledView, onDateChange, onViewChange]);

  if (options.items === undefined) return calendar;

  if (options.getDate === undefined) {
    throw new Error('getDate is required when items are supplied');
  }
  const activeView = projectActiveView(calendar, options as CalendarData<TItem>);
  const result = Object.create(calendar) as CalendarWithActiveView<TViews, TItem>;
  Object.defineProperty(result, 'activeView', {
    configurable: false,
    enumerable: true,
    value: activeView,
    writable: false,
  });
  calendarAliases.set(result, calendar);
  return result;
}

export function CalendarProvider({
  calendar,
  children,
}: {
  calendar: AnyCalendarController;
  children: ReactNode;
}) {
  return createElement(CalendarContext.Provider, { value: unwrapCalendar(calendar) }, children);
}

export function useCalendar(): ContextCalendarController {
  const calendar = useContext(CalendarContext);
  useCalendarSubscription(calendar);
  if (!calendar) {
    throw new Error('useCalendar must be used within CalendarProvider');
  }
  return calendar;
}

type CalendarViewHookOptions<TName extends ViewName, TItem> = {
  view: TName;
  calendar?: AnyCalendarController;
} & ProjectionData<TItem>;

export function useCalendarView<TName extends ViewName, TItem>(
  options: CalendarViewHookOptions<TName, TItem>,
): ViewModel<TName, TItem>;
export function useCalendarView<TName extends ViewName>(options: {
  view: TName;
  calendar?: AnyCalendarController;
}): ViewModel<TName, never>;
export function useCalendarView<TName extends ViewName, TItem>(
  options: CalendarViewHookOptions<TName, TItem>,
): ViewModel<TName, TItem> {
  const contextCalendar = useContext(CalendarContext);
  const calendar = options.calendar ? unwrapCalendar(options.calendar) : contextCalendar;
  useCalendarSubscription(calendar);
  if (!calendar) {
    throw new Error('useCalendarView must be used within CalendarProvider or receive a calendar');
  }

  if (options.view === 'month') {
    return buildMonthView({
      ...options,
      calendar: calendar as never,
    }) as MonthView<TItem> as ViewModel<TName, TItem>;
  }
  if (options.view === 'week') {
    return buildWeekView({
      ...options,
      calendar: calendar as never,
    }) as WeekView<TItem> as ViewModel<TName, TItem>;
  }
  return buildDayView({ ...options, calendar: calendar as never }) as DayView<TItem> as ViewModel<
    TName,
    TItem
  >;
}
