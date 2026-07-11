import type { ComponentType } from "react";
import basicMonthSource from "./basic-month.tsx?raw";
import { BasicMonthExample } from "./basic-month";
import dayViewSource from "./day-view.tsx?raw";
import { DayViewExample } from "./day-view";
import multiViewSource from "./multi-view.tsx?raw";
import { MultiViewExample } from "./multi-view";
import weekViewSource from "./week-view.tsx?raw";
import { SimpleWeekExample, WeekSlotsExample } from "./week-view";

export type CalendarExample = {
  component: ComponentType;
  source: string;
  title: string;
  description: string;
  previewClassName?: string;
};

export const calendarExamples = {
  "basic-month": {
    component: BasicMonthExample,
    source: basicMonthSource,
    title: "Basic month",
    description: "A navigable month whose event type is inferred from values.",
  },
  "simple-week": {
    component: SimpleWeekExample,
    source: weekViewSource,
    title: "Simple week",
    description: "Seven calendar days with a query owned below Suspense.",
  },
  "week-slots": {
    component: WeekSlotsExample,
    source: weekViewSource,
    title: "Week with time slots",
    description: "Timed events projected onto explicit Temporal geometry.",
    previewClassName: "items-start",
  },
  "day-view": {
    component: DayViewExample,
    source: dayViewSource,
    title: "Day view",
    description: "A scrollable day timeline with timezone-aware event placement.",
  },
  "multi-view": {
    component: MultiViewExample,
    source: multiViewSource,
    title: "Month, week, and day",
    description: "One item-agnostic controller driving three projections.",
  },
} satisfies Record<string, CalendarExample>;

export type CalendarExampleName = keyof typeof calendarExamples;
