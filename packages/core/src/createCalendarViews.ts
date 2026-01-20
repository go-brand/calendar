import type { CalendarViewOptions, DayViewOptions, MonthViewOptions, WeekViewOptions } from './types';

export function createCalendarViews<TItem>() {
  return <
    const TViews extends {
      month?: MonthViewOptions<TItem>;
      week?: WeekViewOptions<TItem>;
      day?: DayViewOptions<TItem>;
    }
  >(
    views: TViews
  ): TViews => {
    return views;
  };
}
