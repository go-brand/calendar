# Calendar v1 DX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved `0.1.0` item-agnostic controller, value-inferred projections, simple React hook, and advanced Suspense composition without releasing packages.

**Architecture:** Core owns one mutable, subscribable calendar controller and three pure item-local projection functions. React binds that same controller to controlled or uncontrolled props, adds an item-agnostic context, and computes simple-mode `activeView` through the core projections. Distribution fixtures consume packed packages so declarations, exports, and the React client boundary are tested as users receive them.

**Tech Stack:** TypeScript 5.7, React 18/19, `@js-temporal/polyfill`, Vitest 4, Testing Library, tsup, pnpm.

## Global Constraints

- Use Temporal primitives exclusively; never introduce `Date`, date-fns, Moment, or an installed global Temporal.
- Keep the controller item-agnostic and item generics local to projections.
- Built-in views are exactly `month`, `week`, and `day`; at least one is required.
- Visible ranges are half-open `{ start, end }` `Temporal.ZonedDateTime` values in the controller timezone.
- `getDate` is required when `items` is supplied; `getStart` is optional; `getEnd` is not part of v1.
- Week/day geometry uses `Temporal.PlainTime` and `Temporal.Duration` directly.
- React context never carries or accepts an item generic.
- Preserve `"use client"` in published React ESM and exclude test declarations from packed packages.
- Do not publish or run `pnpm release` as part of this plan.

---

### Task 1: Item-agnostic controller and half-open ranges

**Files:**
- Rewrite: `packages/core/src/types.ts`
- Rewrite: `packages/core/src/core/calendar.ts`
- Modify: `packages/core/src/utils/dateRanges.ts`
- Rewrite: `packages/core/src/core/calendar.test.ts`
- Modify: `packages/core/src/utils/dateRanges.test.ts`

**Interfaces:**
- Produces: `ViewName`, `CalendarViewConfig`, `NonEmptyCalendarViews`, `VisibleRange`, `CalendarOptions<TViews>`, and `CalendarController<TViews>`.
- Produces: `createCalendar(options)` with `date`, `view`, `views`, `visibleRange`, `title`, `setDate`, `setView`, `next`, `previous`, `today`, and `subscribe`.

- [x] **Step 1: Write failing controller tests**

```ts
const calendar = createCalendar({
  views: { month: true, week: true },
  date: Temporal.PlainDate.from('2026-07-10'),
  defaultView: 'month',
  timeZone: 'America/Asuncion',
});

expect(calendar.view).toBe('month');
expect(calendar.visibleRange.end.toPlainTime().toString()).toBe('00:00:00');
calendar.next();
expect(calendar.date.toString()).toBe('2026-08-10');
expect(() => calendar.setView('day' as never)).toThrow('not configured');
```

Also cover empty views, invalid defaults/requests, timezone-specific initial `today()`, locale-aware titles, subscription notifications, non-positive slot durations, and `dayEnd <= dayStart`.

- [x] **Step 2: Verify RED**

Run: `pnpm test packages/core/src/core/calendar.test.ts packages/core/src/utils/dateRanges.test.ts --run`

Expected: failures for the old stateful/generic API and old inclusive `end` range.

- [x] **Step 3: Implement the minimal controller and range contract**

```ts
export type VisibleRange = {
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
};

export type CalendarController<TViews extends NonEmptyCalendarViews = NonEmptyCalendarViews> = {
  readonly date: Temporal.PlainDate;
  readonly view: keyof TViews & ViewName;
  readonly views: TViews;
  readonly visibleRange: VisibleRange;
  title(locales?: Temporal.LocalesArgument, options?: Intl.DateTimeFormatOptions): string;
  setDate(date: Temporal.PlainDate): void;
  setView(view: keyof TViews & ViewName): void;
  next(): void;
  previous(): void;
  today(): void;
  subscribe(listener: () => void): () => void;
};
```

Derive range from source date/view/config each time state changes. Build ZonedDateTime boundaries with each PlainDate's midnight in the configured timezone so DST-length days remain correct.

- [x] **Step 4: Verify GREEN**

Run: `pnpm test packages/core/src/core/calendar.test.ts packages/core/src/utils/dateRanges.test.ts packages/core/src/utils/dst.test.ts --run`

Expected: all selected files pass with no warnings.

### Task 2: Pure month, week, and day projections

**Files:**
- Create: `packages/core/src/core/projections.ts`
- Create: `packages/core/src/core/projections.test.ts`
- Modify: `packages/core/src/types.ts`

**Interfaces:**
- Consumes: `CalendarController<TViews>` from Task 1.
- Produces: `buildMonthView`, `buildWeekView`, and `buildDayView`.
- Produces discriminated `MonthView<TItem>`, `WeekView<TItem>`, and `DayView<TItem>` models with `view: 'month' | 'week' | 'day'`.

- [x] **Step 1: Write failing projection tests**

```ts
const month = buildMonthView({
  calendar,
  items: [{ id: 'summary', date: Temporal.PlainDate.from('2026-07-10') }],
  getDate: (item) => item.date,
});

const week = buildWeekView({
  calendar,
  items: [{ id: 1, startsAt }],
  getDate: (item) => item.startsAt.toPlainDate(),
  getStart: (item) => item.startsAt,
});

expect(month.view).toBe('month');
expect(week.view).toBe('week');
expect(week.days.flatMap((day) => day.timeSlots ?? []).flatMap((slot) => slot.items)).toHaveLength(1);
```

Cover data-free grids, unrelated item types under one controller, untimed day-level items, `items` without `getDate` through an `unknown`/JavaScript call, configured timezone `isToday`, and configured week/day geometry.

- [x] **Step 2: Verify RED**

Run: `pnpm test packages/core/src/core/projections.test.ts --run`

Expected: module/functions do not exist.

- [x] **Step 3: Implement projections over direct Temporal geometry**

```ts
type ProjectionData<TItem> =
  | { items: readonly TItem[]; getDate: (item: TItem) => Temporal.PlainDate; getStart?: (item: TItem) => Temporal.ZonedDateTime }
  | { items?: undefined; getDate?: undefined; getStart?: undefined };
```

Group once by PlainDate string, assign timed items to half-open slots `[slotStart, slotEnd)`, and keep untimed items only on the day collection. Validate that the requested projection is configured.

- [x] **Step 4: Verify GREEN and invariants**

Run: `pnpm test packages/core/src/core/projections.test.ts packages/core/src/invariants.test.ts packages/core/src/utils/dst.test.ts --run`

Expected: projection, invariant, and DST tests all pass.

### Task 3: React simple mode, context, controlled state, and Suspense composition

**Files:**
- Rewrite: `packages/react/src/index.ts`
- Rewrite: `packages/react/src/index.test.tsx`

**Interfaces:**
- Consumes: controller and projection functions from Tasks 1-2.
- Produces: `useCreateCalendar`, `CalendarProvider`, `useCalendar`, and `useCalendarView`.
- Produces: data overload returning `CalendarController<TViews> & { activeView: ActiveView<TViews, TItem> }`; data-free overload returns the item-agnostic controller.

- [x] **Step 1: Write failing React tests**

```tsx
const { result, rerender } = renderHook(
  ({ date, timeZone }) => useCreateCalendar({ views, date, timeZone, items, getDate }),
  { initialProps: { date: july, timeZone: 'UTC' } },
);

expect(result.current.activeView.view).toBe('month');
rerender({ date: august, timeZone: 'America/New_York' });
expect(result.current.date.equals(august)).toBe(true);
expect(result.current.visibleRange.timeZoneId).toBeUndefined();
```

Add separate assertions for controlled view callbacks, geometry rerenders, item inference behavior at runtime, missing provider errors, explicit-controller projection, independent item types, and a Suspense test where controls remain mounted while the active child fallback is visible.

- [x] **Step 2: Verify RED**

Run: `pnpm test packages/react/src/index.test.tsx --run`

Expected: failures because the old hook requires factories/accessors and context is item-generic.

- [x] **Step 3: Implement the React binding**

Use React state only for controlled/uncontrolled coordination and a controller subscription for rerenders. Recreate the core controller from primitive configuration signatures when controlled date/view, timezone, or view geometry changes; do not mutate options during render. Compute `activeView` and `useCalendarView` through the Task 2 functions.

- [x] **Step 4: Verify GREEN**

Run: `pnpm test packages/react/src/index.test.tsx --run`

Expected: all React tests pass, including controlled rerenders and Suspense.

### Task 4: Public exports and emitted-package contract

**Files:**
- Rewrite: `packages/core/src/index.ts`
- Modify: `packages/core/package.json`
- Modify: `packages/react/package.json`
- Modify: `packages/react/tsup.config.ts`
- Modify: `package.json`
- Create: `fixtures/package-consumer/package.json`
- Create: `fixtures/package-consumer/tsconfig.json`
- Create: `fixtures/package-consumer/index.tsx`
- Create: `scripts/verify-packages.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Core runtime exports exactly `createCalendar`, `buildMonthView`, `buildWeekView`, `buildDayView`, and `getWeekdays`.
- React re-exports core plus `useCreateCalendar`, `CalendarProvider`, `useCalendar`, and `useCalendarView`.

- [x] **Step 1: Add a failing packed-consumer fixture**

The fixture imports package names, uses simple inference, independent advanced projections, configured-view narrowing, and compiler-enforced `@ts-expect-error` checks for empty views, missing accessors, forged context generics, and unconfigured view names.

- [x] **Step 2: Verify RED**

Run: `pnpm build && pnpm verify:packages`

Expected: the old declarations/exports and React client boundary fail fixture checks.

- [x] **Step 3: Restrict exports and implement distribution verification**

Have `verify-packages.ts` pack both packages into a temporary directory, install both tarballs into a fresh copied fixture, run its TypeScript compiler, inspect ESM/CJS resolution, assert the ESM begins with `"use client"`, and reject any `*.test.d.ts` in packed contents.

- [x] **Step 4: Verify GREEN**

Run: `pnpm build && pnpm verify:packages`

Expected: packed consumer compile and all content/client-boundary checks pass.

### Task 5: Demo, README, website, llms, and generated skill migration

**Files:**
- Modify: `apps/demo/src/components/PostCalendar.tsx`
- Modify: `apps/demo/src/components/PostMonthlyView.tsx`
- Modify: `apps/demo/src/components/PostWeeklyView.tsx`
- Modify: `apps/demo/src/components/PostDailyView.tsx`
- Modify: `apps/demo/src/lib/calendarConfig.ts`
- Rewrite: `packages/core/README.md`
- Rewrite: `packages/react/README.md`
- Modify/replace obsolete pages under: `apps/www/content/docs/`
- Modify: `apps/www/src/components/examples/*.tsx`
- Modify: `scripts/generate-docs.ts`
- Regenerate: `apps/www/public/llms.txt`
- Regenerate: `skills/calendar/SKILL.md`

**Interfaces:**
- Consumes: final public package surface.
- Produces: complete compiling simple and Suspense examples with no casts or explicit simple-path generics.

- [x] **Step 1: Migrate compiled examples and make old names fail the docs scan**

Run: `rg -n "createCalendarAccessor|createCalendarViews|useView|CalendarInstance|getMonth\(|getWeek\(|getDay\(" packages apps scripts skills --glob '!**/dist/**'`.

Expected before migration: matches in demo, READMEs, docs, examples, and generator.

- [x] **Step 2: Replace examples with v1 composition**

Use `calendar.activeView` for simple examples and `CalendarProvider` + `useCalendarView` under `Suspense` for advanced examples. Replace inclusive query ends with `visibleRange.end`.

- [x] **Step 3: Remove implicit home-directory writes**

`pnpm generate:docs` writes only repository `llms.txt` and `skills/calendar/SKILL.md`. Any global installation must remain a separate explicit command not run by generation.

- [x] **Step 4: Verify docs and apps**

Run: `pnpm generate:docs && pnpm --filter demo build && pnpm --filter @gobrand/calendar-docs build`

Expected: generation and both application builds pass; the obsolete-name scan has no source matches.

### Task 6: Downstream `tanstack-start` migration

**Files:**
- Modify: `/Users/rubencostamartinez/Desktop/tanstack-start/packages/ui/src/plain-date-calendar.tsx`
- Modify: `/Users/rubencostamartinez/Desktop/tanstack-start/apps/app/src/features/calendar/lib/calendar-config.ts`
- Modify: `/Users/rubencostamartinez/Desktop/tanstack-start/apps/app/src/features/calendar/components/calendar-heatmap.tsx`
- Modify: `/Users/rubencostamartinez/Desktop/tanstack-start/apps/app/src/features/calendar/components/calendar/calendar-view-content.tsx`
- Modify: `/Users/rubencostamartinez/Desktop/tanstack-start/apps/app/src/features/calendar/calendar-screen.tsx`
- Modify: `/Users/rubencostamartinez/Desktop/tanstack-start/apps/app/src/routes/_authenticated/_orgLayout/$teamId/channels/$connectionId/posts/calendar.tsx`
- Modify dependent calendar view/toolbar types only where compiler errors require it.

**Interfaces:**
- Consumes: v1 package declarations via a temporary pnpm override/link during verification; do not release.

- [x] **Step 1: Capture targeted typecheck failures against v1 declarations**

Point only the relevant app/UI dependency resolution at the local packed `0.1.0` packages, then run targeted typechecks. Do not alter unrelated dirty files or stash the worktree.

- [x] **Step 2: Migrate the plain-date calendar**

Use `useCreateCalendar({ views: { month: true }, date: selected, timeZone, weekStartsOn })`, render `activeView`, and call `previous`/`next`/`title`.

- [x] **Step 3: Migrate Suspense calendar views**

Keep controls/provider above Suspense and move each data query plus `useCalendarView({ view, items, getDate, getStart })` below it. Remove shared item accessors/factories.

- [x] **Step 4: Verify downstream consumers**

Run targeted `packages/ui` and `apps/app` typechecks plus their calendar tests. Expected: no v1 API errors and no unrelated files modified by this task.

### Task 7: Full verification and acceptance audit

**Files:**
- Modify only files required to fix verification failures caused by Tasks 1-6.

- [x] **Step 1: Run repository gates**

Run: `pnpm test --run && pnpm typecheck && pnpm build && pnpm verify:packages`

- [x] **Step 2: Run app/docs gates**

Run: `pnpm --filter demo build && pnpm --filter @gobrand/calendar-docs build && pnpm generate:docs`

- [x] **Step 3: Audit the spec line by line**

Confirm all ten acceptance criteria, intended runtime exports, timezone behavior, controlled rerenders, generated examples, packed content, and downstream migration. Record any non-implementation blocker explicitly.

- [x] **Step 4: Inspect the final diff**

Run: `git status --short && git diff --check && git diff --stat` in both touched repositories. Preserve pre-existing changes and do not release.
