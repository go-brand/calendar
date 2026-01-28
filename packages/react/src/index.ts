'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

export * from '@gobrand/calendar-core';

import {
  createCalendar,
  type Calendar,
  type CalendarInstance,
  type CalendarOptions,
  type ViewType,
  type ViewResultFor,
} from '@gobrand/calendar-core';

// ============================================================================
// useCreateCalendar - Creates a calendar instance
// ============================================================================

/**
 * Creates and manages a calendar instance with React state.
 *
 * @example
 * const calendar = useCreateCalendar<Post>({
 *   views: { month: { accessor: { getDate: (p) => p.date } } },
 *   timeZone: 'America/New_York',
 * });
 */
export function useCreateCalendar<TItem, TOptions extends CalendarOptions<TItem> = CalendarOptions<TItem>>(
  options: TOptions
): Calendar<TItem, TOptions> {
  // Create a new calendar and store it in state
  const [calendarRef] = useState(() => ({
    current: createCalendar<TItem, TOptions>(options),
  }));

  // By default, manage calendar state here using the calendar's initial state
  const [state, setState] = useState(() => calendarRef.current.getState());

  // Compose the default state above with any user state. This will allow the user
  // to only control a subset of the state if desired.
  calendarRef.current.setOptions((prev) => ({
    ...prev,
    ...options,
    state: {
      ...state,
      ...options.state,
    },
    // Similarly, we'll maintain both our internal state and any user-provided state.
    onStateChange: (updater) => {
      setState(updater);
      options.onStateChange?.(updater);
    },
  } as TOptions));

  return calendarRef.current as Calendar<TItem, TOptions>;
}

// ============================================================================
// CalendarProvider & useCalendar - Context for calendar instance
// ============================================================================

const CalendarContext = createContext<CalendarInstance<unknown> | null>(null);

export interface CalendarProviderProps<TItem, TOptions extends CalendarOptions<TItem>> {
  calendar: Calendar<TItem, TOptions>;
  children: React.ReactNode;
}

/**
 * Provides a calendar instance to descendant components via context.
 *
 * @example
 * const calendar = useCreateCalendar({ views, timeZone });
 *
 * return (
 *   <CalendarProvider calendar={calendar}>
 *     <CalendarToolbar />
 *     <Suspense fallback={<Loading />}>
 *       <CalendarGrid />
 *     </Suspense>
 *   </CalendarProvider>
 * );
 */
export function CalendarProvider<TItem, TOptions extends CalendarOptions<TItem>>({
  calendar,
  children,
}: CalendarProviderProps<TItem, TOptions>) {
  return React.createElement(
    CalendarContext.Provider,
    { value: calendar as CalendarInstance<unknown> },
    children
  );
}

/**
 * Gets the calendar instance from context with typed item data.
 * Must be used within a CalendarProvider.
 *
 * @example
 * function CalendarToolbar() {
 *   const calendar = useCalendar<Post>();
 *   // calendar.getMonth(posts) returns CalendarMonth<Post>
 *   // Items are typed as Post, not any
 *   return (
 *     <div>
 *       <span>{calendar.getTitle()}</span>
 *       <button onClick={() => calendar.next()}>Next</button>
 *     </div>
 *   );
 * }
 */
export function useCalendar<TItem = unknown>(): CalendarInstance<TItem> {
  const calendar = useContext(CalendarContext);
  if (!calendar) {
    throw new Error(
      'useCalendar must be used within a CalendarProvider. ' +
      'Wrap your component tree with <CalendarProvider calendar={calendar}>.'
    );
  }
  // Cast from CalendarInstance<unknown> to CalendarInstance<TItem>
  // This is safe because TItem is the same at runtime, only differs at type level
  return calendar as CalendarInstance<TItem>;
}

// ============================================================================
// useView - Get memoized view data
// ============================================================================

export interface UseViewOptions<TItem, V extends ViewType | undefined = undefined> {
  /** The data items to place on the calendar */
  data: TItem[];
  /** Override the current view. If not specified, uses calendar.currentView */
  name?: V;
  /** Explicit calendar instance. If not specified, uses context */
  calendar?: CalendarInstance<TItem>;
}

/**
 * Gets memoized view data for the calendar.
 *
 * @example
 * // Dynamic view - returns discriminated union based on currentView
 * const view = useView({ data: posts });
 * if (view.type === 'month') {
 *   return <MonthGrid month={view.data} />;
 * }
 *
 * @example
 * // Specific view - returns narrowed type
 * const month = useView({ data: posts, name: 'month' });
 * // month.type is always 'month', month.data is CalendarMonth<Post>
 *
 * @example
 * // Dual view
 * const month = useView({ data: posts, name: 'month' });
 * const week = useView({ data: posts, name: 'week' });
 */
export function useView<TItem, V extends ViewType | undefined = undefined>(
  options: UseViewOptions<TItem, V>
): ViewResultFor<TItem, V> {
  const { data, name, calendar: explicitCalendar } = options;

  // Try explicit calendar first, then context
  const contextCalendar = useContext(CalendarContext);
  // Cast context calendar to match TItem - safe because we pass typed data
  const calendar = explicitCalendar ?? (contextCalendar as CalendarInstance<TItem> | null);

  if (!calendar) {
    throw new Error(
      'No calendar found. Either wrap your component tree in <CalendarProvider> ' +
      'or pass calendar explicitly: useView({ calendar, data }).'
    );
  }

  const state = calendar.getState();
  const effectiveView = name ?? state.currentView;

  return useMemo(() => {
    switch (effectiveView) {
      case 'month':
        return { type: 'month' as const, data: calendar.getMonth(data) };
      case 'week':
        return { type: 'week' as const, data: calendar.getWeek(data) };
      case 'day':
        return { type: 'day' as const, data: calendar.getDay(data) };
      default:
        throw new Error(`Unknown view: ${effectiveView}`);
    }
  }, [
    calendar,
    data,
    state.referenceDate.toString(),
    effectiveView,
  ]) as ViewResultFor<TItem, V>;
}
