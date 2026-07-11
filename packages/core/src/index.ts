export { createCalendar } from './core/calendar';
export { buildDayView, buildMonthView, buildWeekView } from './core/projections';
export { getWeekdays } from './utils/getWeekdays';

export type {
  ActiveView,
  CalendarController,
  CalendarDay,
  CalendarDayView,
  CalendarMonth,
  CalendarOptions,
  CalendarViews,
  CalendarWeek,
  CalendarWeekView,
  ConfiguredView,
  DayView,
  MonthView,
  MonthViewConfig,
  NonEmptyCalendarViews,
  ProjectionData,
  ResolvedCalendarViews,
  ResolvedViewConfig,
  TimeSlot,
  TimedViewConfig,
  ViewConfig,
  ViewModel,
  ViewName,
  VisibleRange,
  WeekDay,
  Weekday,
  WeekView,
} from './types';
