import { useState } from 'react';

export * from '@gobrand/calendar-core';

import {
  createCalendar,
  type Calendar,
  type CalendarOptions,
} from '@gobrand/calendar-core';

export function useCalendar<TOptions extends CalendarOptions<any>>(
  options: TOptions
): Calendar<
  TOptions['data'] extends (infer TItem)[] ? TItem : never,
  TOptions
> {
  // Extract TItem from the options type
  type TItem = TOptions['data'] extends (infer U)[] ? U : never;

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
