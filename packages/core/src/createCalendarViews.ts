import type { DayViewOptions, MonthViewOptions, WeekViewOptions } from './types';

export function createCalendarViews<T>() {
  return <
    const V extends {
      month?: MonthViewOptions<T>;
      week?: WeekViewOptions<T>;
      day?: DayViewOptions<T>;
    }
  >(
    views: V
  ): V => {
    return views;
  };
}
