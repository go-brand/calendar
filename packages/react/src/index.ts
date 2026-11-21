'use client';

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
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type {
  FocusEvent,
  FocusEventHandler,
  KeyboardEvent,
  KeyboardEventHandler,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
} from 'react';
import type { Temporal } from '@js-temporal/polyfill';
import { Temporal as temporal } from './temporal-runtime';

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
  const timeZone = options.timeZone ?? temporal.Now.timeZoneId();
  const configuredViews = Object.keys(views) as ConfiguredView<TViews>[];
  const initialView = defaultView ?? configuredViews[0];
  const [uncontrolledDate, setUncontrolledDate] = useState(
    () => defaultDate ?? temporal.Now.zonedDateTimeISO(timeZone).toPlainDate(),
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
    () =>
      createCalendar({
        views,
        date: resolvedDate,
        view: resolvedView,
        timeZone,
        weekStartsOn,
      }),
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

export type UseCalendarGridOptions = {
  calendar?: AnyCalendarController;
  focusedDate?: Temporal.PlainDate;
  onFocusedDateChange?: (date: Temporal.PlainDate) => void;
  selectedDate?: Temporal.PlainDate;
  onSelectDate?: (date: Temporal.PlainDate) => void;
};

export type CalendarGridProps<TProps extends Record<string, unknown> = Record<string, unknown>> =
  Omit<TProps, 'role' | 'aria-label' | 'onKeyDown'> & {
    role: 'grid';
    'aria-label': string;
    onKeyDown: KeyboardEventHandler<HTMLElement>;
  };

export type CalendarDayCellProps<TProps extends Record<string, unknown> = Record<string, unknown>> =
  Omit<
    TProps,
    'role' | 'tabIndex' | 'aria-selected' | 'aria-current' | 'data-date' | 'onFocus' | 'onClick'
  > & {
    role: 'gridcell';
    tabIndex: 0 | -1;
    'aria-selected': boolean;
    'aria-current': 'date' | undefined;
    'data-date': string;
    onFocus: FocusEventHandler<HTMLElement>;
    onClick: MouseEventHandler<HTMLElement>;
  };

export type CalendarGridResult = {
  focusedDate: Temporal.PlainDate;
  setFocusedDate: (date: Temporal.PlainDate) => void;
  getGridProps: <TProps extends Record<string, unknown> = Record<string, unknown>>(
    props?: TProps,
  ) => CalendarGridProps<TProps>;
  getDayCellProps: <TProps extends Record<string, unknown> = Record<string, unknown>>(
    date: Temporal.PlainDate,
    props?: TProps,
  ) => CalendarDayCellProps<TProps>;
};

export function useCalendarGrid(options: UseCalendarGridOptions = {}): CalendarGridResult {
  const contextCalendar = useContext(CalendarContext);
  const calendar = options.calendar ? unwrapCalendar(options.calendar) : contextCalendar;
  if (!calendar) {
    throw new Error('useCalendarGrid must be used within CalendarProvider or receive a calendar');
  }

  const {
    focusedDate: controlledFocused,
    onFocusedDateChange,
    selectedDate,
    onSelectDate,
  } = options;

  const [uncontrolledFocused, setUncontrolledFocused] = useState<Temporal.PlainDate>(
    () => controlledFocused ?? calendar.date,
  );
  const focusedDate = controlledFocused ?? uncontrolledFocused;
  const pendingFocusRef = useRef<{ container: HTMLElement; date: string } | null>(null);

  const updateFocusedDate = (nextDate: Temporal.PlainDate) => {
    if (controlledFocused === undefined) {
      setUncontrolledFocused(nextDate);
    }
    onFocusedDateChange?.(nextDate);
  };

  const focusedSignature = focusedDate.toString();
  const calendarDateSignature = calendar.date.toString();

  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending || pending.date !== focusedSignature) return;
    pendingFocusRef.current = null;
    const cell = pending.container.querySelector<HTMLElement>(`[data-date="${pending.date}"]`);
    cell?.focus();
  }, [focusedSignature, calendarDateSignature]);

  const timeZone = calendar.visibleRange.start.timeZoneId;
  const today = temporal.Now.zonedDateTimeISO(timeZone).toPlainDate();

  const shouldNavigateTo = (nextDate: Temporal.PlainDate, forceNavigate: boolean) => {
    if (forceNavigate) return true;
    if (calendar.view === 'month') {
      return nextDate.month !== calendar.date.month || nextDate.year !== calendar.date.year;
    }
    const rangeStart = calendar.visibleRange.start.toPlainDate();
    const rangeEnd = calendar.visibleRange.end.toPlainDate();
    return (
      temporal.PlainDate.compare(nextDate, rangeStart) < 0 ||
      temporal.PlainDate.compare(nextDate, rangeEnd) >= 0
    );
  };

  const getGridProps = <TProps extends Record<string, unknown> = Record<string, unknown>>(
    props?: TProps,
  ): CalendarGridProps<TProps> => {
    const userOnKeyDown = props?.onKeyDown as KeyboardEventHandler<HTMLElement> | undefined;
    const userAriaLabel = props?.['aria-label'] as string | undefined;

    const onKeyDown: KeyboardEventHandler<HTMLElement> = (event: KeyboardEvent<HTMLElement>) => {
      userOnKeyDown?.(event);
      if (event.defaultPrevented) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelectDate?.(focusedDate);
        return;
      }

      let nextDate: Temporal.PlainDate | null = null;
      let forceNavigate = false;

      switch (event.key) {
        case 'ArrowLeft':
          nextDate = focusedDate.subtract({ days: 1 });
          break;
        case 'ArrowRight':
          nextDate = focusedDate.add({ days: 1 });
          break;
        case 'ArrowUp':
          nextDate =
            calendar.view === 'month'
              ? focusedDate.subtract({ weeks: 1 })
              : focusedDate.subtract({ days: 1 });
          break;
        case 'ArrowDown':
          nextDate =
            calendar.view === 'month'
              ? focusedDate.add({ weeks: 1 })
              : focusedDate.add({ days: 1 });
          break;
        case 'Home': {
          const weekStartsOn = calendar.visibleRange.start.toPlainDate().dayOfWeek;
          const offset = (focusedDate.dayOfWeek - weekStartsOn + 7) % 7;
          nextDate = focusedDate.subtract({ days: offset });
          break;
        }
        case 'End': {
          const weekStartsOn = calendar.visibleRange.start.toPlainDate().dayOfWeek;
          const offset = (focusedDate.dayOfWeek - weekStartsOn + 7) % 7;
          nextDate = focusedDate.subtract({ days: offset }).add({ days: 6 });
          break;
        }
        case 'PageUp':
          nextDate = event.shiftKey
            ? focusedDate.subtract({ years: 1 })
            : focusedDate.subtract({ months: 1 });
          forceNavigate = true;
          break;
        case 'PageDown':
          nextDate = event.shiftKey
            ? focusedDate.add({ years: 1 })
            : focusedDate.add({ months: 1 });
          forceNavigate = true;
          break;
        default:
          return;
      }

      event.preventDefault();
      pendingFocusRef.current = { container: event.currentTarget, date: nextDate.toString() };
      updateFocusedDate(nextDate);
      if (shouldNavigateTo(nextDate, forceNavigate)) {
        calendar.setDate(nextDate);
      }
    };

    return {
      ...(props as TProps),
      role: 'grid',
      'aria-label': userAriaLabel ?? calendar.title(),
      onKeyDown,
    };
  };

  const getDayCellProps = <TProps extends Record<string, unknown> = Record<string, unknown>>(
    date: Temporal.PlainDate,
    props?: TProps,
  ): CalendarDayCellProps<TProps> => {
    const userOnFocus = props?.onFocus as FocusEventHandler<HTMLElement> | undefined;
    const userOnClick = props?.onClick as MouseEventHandler<HTMLElement> | undefined;
    const isFocused = date.equals(focusedDate);
    const isSelected = selectedDate ? date.equals(selectedDate) : false;
    const isToday = date.equals(today);

    const onFocus: FocusEventHandler<HTMLElement> = (event: FocusEvent<HTMLElement>) => {
      if (!date.equals(focusedDate)) {
        updateFocusedDate(date);
      }
      userOnFocus?.(event);
    };

    const onClick: MouseEventHandler<HTMLElement> = (event: MouseEvent<HTMLElement>) => {
      updateFocusedDate(date);
      onSelectDate?.(date);
      userOnClick?.(event);
    };

    return {
      ...(props as TProps),
      role: 'gridcell',
      tabIndex: isFocused ? 0 : -1,
      'aria-selected': isSelected,
      'aria-current': isToday ? 'date' : undefined,
      'data-date': date.toString(),
      onFocus,
      onClick,
    };
  };

  return {
    focusedDate,
    setFocusedDate: updateFocusedDate,
    getGridProps,
    getDayCellProps,
  };
}
