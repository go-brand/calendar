import type { ComponentType } from 'react';
import basicMonthSource from './basic-month.tsx?raw';
import { BasicMonthExample } from './basic-month';
import datePickerSource from './date-picker.tsx?raw';
import { DatePickerExample } from './date-picker';
import dayViewSource from './day-view.tsx?raw';
import { DayViewExample } from './day-view';
import multiViewSource from './multi-view.tsx?raw';
import { MultiViewExample } from './multi-view';
import suspenseMonthSource from './suspense-month.tsx?raw';
import { SuspenseMonthExample } from './suspense-month';
import weekViewSource from './week-view.tsx?raw';
import { SimpleWeekExample, WeekSlotsExample } from './week-view';

export type CalendarExample = {
  component: ComponentType;
  source: string;
  title: string;
  description: string;
  previewClassName?: string;
};

export const calendarExamples = {
  'basic-month': {
    component: BasicMonthExample,
    source: basicMonthSource,
    title: 'Basic month',
    description: 'A month of events with navigation.',
  },
  'date-picker': {
    component: DatePickerExample,
    source: datePickerSource,
    title: 'Date picker',
    description: 'Pick a date. No event data needed.',
  },
  'simple-week': {
    component: SimpleWeekExample,
    source: weekViewSource,
    title: 'Simple week',
    description: 'Seven days, each with its events.',
  },
  'week-slots': {
    component: WeekSlotsExample,
    source: weekViewSource,
    title: 'Week with time slots',
    description: 'Timed events in hourly slots.',
    previewClassName: 'items-start',
  },
  'day-view': {
    component: DayViewExample,
    source: dayViewSource,
    title: 'Day view',
    description: 'One day, hour by hour.',
  },
  'multi-view': {
    component: MultiViewExample,
    source: multiViewSource,
    title: 'Month, week, and day',
    description: 'Switch between month, week, and day.',
  },
  'suspense-month': {
    component: SuspenseMonthExample,
    source: suspenseMonthSource,
    title: 'Month with Suspense',
    description: 'Navigation stays usable while events load.',
  },
} satisfies Record<string, CalendarExample>;

export type CalendarExampleName = keyof typeof calendarExamples;
