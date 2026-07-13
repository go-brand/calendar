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
    description: 'A navigable month whose event type is inferred from values.',
  },
  'date-picker': {
    component: DatePickerExample,
    source: datePickerSource,
    title: 'Date picker',
    description: 'A month-only picker with no event data or accessors.',
  },
  'simple-week': {
    component: SimpleWeekExample,
    source: weekViewSource,
    title: 'Simple week',
    description: 'Seven calendar days with locally grouped events.',
  },
  'week-slots': {
    component: WeekSlotsExample,
    source: weekViewSource,
    title: 'Week with time slots',
    description: 'Timed events projected onto explicit Temporal geometry.',
    previewClassName: 'items-start',
  },
  'day-view': {
    component: DayViewExample,
    source: dayViewSource,
    title: 'Day view',
    description: 'A scrollable day timeline with timezone-aware event placement.',
  },
  'multi-view': {
    component: MultiViewExample,
    source: multiViewSource,
    title: 'Month, week, and day',
    description: 'Switch between month, week, and day with one event source.',
  },
  'suspense-month': {
    component: SuspenseMonthExample,
    source: suspenseMonthSource,
    title: 'Month with Suspense',
    description: "Keep navigation available while the visible month's events load.",
  },
} satisfies Record<string, CalendarExample>;

export type CalendarExampleName = keyof typeof calendarExamples;
