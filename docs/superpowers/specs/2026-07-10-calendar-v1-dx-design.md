# Calendar v1 DX Design

**Status:** Approved direction, awaiting written-spec review

**Date:** 2026-07-10

**Target release:** `0.1.0`

**Packages:** `@gobrand/calendar-core`, `@gobrand/react-calendar`

## Summary

Calendar v1 will remain a small, headless, Temporal-first calendar engine. Its
default React API will make the common case require one hook, no explicit generic
arguments, no accessor factory, no curried view factory, and no provider. The
same underlying controller and projection primitives will support advanced
composition where controls stay outside Suspense and each view fetches and maps
its own data below a Suspense boundary.

The design uses progressive disclosure rather than separate simple and advanced
implementations:

- The calendar controller owns date, active view, timezone, navigation, and the
  visible query range.
- A view projection owns items and the functions that map those items onto
  calendar dates and times.
- Simple mode installs one default data source and computes the active view for
  the caller.
- Advanced mode creates the controller without data, then projects data inside
  each view component.
- Both modes call the same pure core projection functions.

## Goals

1. Make a useful month or multi-view calendar obvious to humans and coding
   agents without reading the type implementation.
2. Infer item and configured-view types from values supplied by the caller.
3. Keep calendar controls interactive while Suspense queries load active-view
   content.
4. Allow different views in one calendar to use different queries, item types,
   mappings, and rendering components.
5. Make timezone, range, controlled-state, and invalid-configuration behavior
   explicit and internally consistent.
6. Preserve the library's headless, UI-agnostic, direct-Temporal philosophy.

## Non-goals

- Shipping styled calendar components.
- Owning data fetching, caching, or Suspense behavior.
- Dragging, resizing, accessibility widgets, or event collision layout in this
  release.
- Supporting arbitrary custom view names in v1. The built-in view names are
  `month`, `week`, and `day`.
- Dynamically switching between native Temporal and the polyfill. Version 0.1.0
  consistently uses `@js-temporal/polyfill`, does not install a global, and
  documents that runtime boundary explicitly.
- Preserving source compatibility with the `0.0.x` type surface.
- Replacing `@gobrand/tiempo` as the general-purpose datetime utility package.

## Design principles

### One engine, two levels of disclosure

The simple API is a convenience over the advanced primitives, not a parallel
implementation. Fixes to date math, timezone behavior, item grouping, or view
construction therefore affect both modes automatically.

### The controller is item-agnostic

Item generics do not belong in calendar state or React context. The controller
can exist before data is available and can be shared by controls without knowing
what a post, meeting, booking, or summary looks like.

### Item types are local to projections

Each call that projects items into a month, week, or day infers its own item type.
This permits a month to use summary records while a week uses full event records.
It also prevents a consumer from forging the context item type with a generic
argument.

### Source state and derived state are separate

The writable state is the reference date and active view. The visible range is
derived from them plus timezone and view configuration. Callers cannot provide a
stale range that disagrees with the date or view.

## Core architecture

### Calendar controller

`createCalendar` creates an item-agnostic controller from a non-empty view
configuration.

```ts
const calendar = createCalendar({
  views: {
    month: true,
    week: {
      dayStart: Temporal.PlainTime.from("08:00"),
      dayEnd: Temporal.PlainTime.from("18:00"),
      slotDuration: Temporal.Duration.from({ minutes: 30 }),
    },
  },
  date: Temporal.PlainDate.from("2026-07-10"),
  timeZone: "America/Asuncion",
})
```

The returned `CalendarController<TViews>` exposes:

- `date`
- `view`
- `views`
- `visibleRange`
- `title(locales?, options?)`
- `setDate(date)`
- `setView(view)`
- `next()`
- `previous()`
- `today()`
- `subscribe(listener)` for framework bindings

Direct controller objects preserve the exact configured-view union. A controller
configured with only `month` and `week` rejects `setView("day")` at compile time.

### View configuration

View configuration contains only view geometry and calendar behavior. It never
contains item accessors.

```ts
views: {
  month: true,
  week: {
    dayStart,
    dayEnd,
    slotDuration,
  },
}
```

At least one view is required by both TypeScript and a runtime assertion for
JavaScript consumers. The first configured view is the default unless
`defaultView` is supplied. A supplied default or controlled view must be one of
the configured views.

`weekStartsOn` is a controller-level option because the same calendar should not
reorder weekdays when switching between month and week. It defaults from the
locale when the runtime supports standardized locale week information and can be
overridden explicitly.

### Pure view projections

Core exports one projection function per built-in view. Each function receives a
controller snapshot or explicit date/view geometry plus a local data source.

```ts
const month = buildMonthView({
  calendar,
  items: summaries,
  getDate: summary => summary.date,
})

const week = buildWeekView({
  calendar,
  items: events,
  getDate: event => event.startsAt.toPlainDate(),
  getStart: event => event.startsAt,
})
```

`getDate` is required whenever the `items` option is present. `getStart` is
optional and assigns timed items to their starting slot. Version 0.1.0 does not
accept `getEnd` because interval segmentation and event layout are non-goals.
Items without `getStart` remain in the day-level item collection and are not
assigned to a timed slot. A data-free grid requires no fake `unknown` item type
and no accessor.

### Visible range contract

Visible ranges use half-open semantics:

```ts
type VisibleRange = {
  start: Temporal.ZonedDateTime
  end: Temporal.ZonedDateTime
}
```

`start` is inclusive. `end` is the start of the first date after the
visible interval. This preserves Temporal precision and maps directly to queries
using `>= start` and `< end`.

All range construction, default dates, `today()`, and `isToday` flags use the
controller's configured timezone. No calendar behavior relies on the host
timezone after a timezone is supplied.

## React API

### Simple mode

The common case uses one hook. Item and view types are inferred from values.

```tsx
const calendar = useCreateCalendar({
  views: {
    month: true,
    week: true,
  },
  items: events,
  getDate: event => event.date,
  getStart: event => event.startsAt,
})

return (
  <>
    <button onClick={calendar.previous}>Previous</button>
    <h2>{calendar.title()}</h2>
    <button onClick={calendar.next}>Next</button>
    <CalendarContent view={calendar.activeView} />
  </>
)
```

No explicit generic arguments are needed. `calendar.activeView` is a
discriminated union narrowed to the configured views and contains items of the
inferred item type.

`useCreateCalendar` has two value-driven overloads:

- With `items` and `getDate`, it returns the controller plus `activeView`.
- Without `items`, it returns the item-agnostic controller used by advanced
  composition.

Callers never select an overload with explicit generic arguments.

Simple mode is allowed to suspend the whole component if the caller obtains
`items` from a Suspense query in that component. Users who need controls to stay
visible use advanced composition.

### Advanced Suspense composition

Advanced mode creates the controller above Suspense without items.

```tsx
const calendar = useCreateCalendar({
  views: {
    month: true,
    week: true,
  },
  date,
  timeZone,
})

return (
  <CalendarProvider calendar={calendar}>
    <CalendarControls />
    <Suspense fallback={<CalendarContentSkeleton />}>
      <ActiveView />
    </Suspense>
  </CalendarProvider>
)
```

Each active-view component owns its query and projection.

```tsx
function MonthView() {
  const { data } = useSuspenseQuery(monthQuery)

  const month = useCalendarView({
    view: "month",
    items: data.summaries,
    getDate: summary => summary.date,
  })

  return <MonthGrid month={month} />
}

function WeekView() {
  const { data } = useSuspenseQuery(weekQuery)

  const week = useCalendarView({
    view: "week",
    items: data.events,
    getDate: event => event.startsAt.toPlainDate(),
    getStart: event => event.startsAt,
  })

  return <WeekGrid week={week} />
}
```

`useCalendarView` reads the controller from context unless an explicit
`calendar` is passed. Its item type is inferred independently for every call.
Its `view` argument is a literal built-in view name, so its return type is the
specific month, week, or day model rather than a union.

The application chooses the component for the active view directly:

```tsx
function ActiveView() {
  const calendar = useCalendar()

  switch (calendar.view) {
    case "month": return <MonthView />
    case "week": return <WeekView />
    case "day": return <DayView />
  }
}
```

### React context typing

React context contains an item-agnostic controller. `useCalendar()` accepts no
generic arguments and cannot be used to claim a different item type. The default
context hook exposes the built-in `ViewName` boundary honestly because a global
React context cannot infer the exact provider value at a distant call site.

Exact configured-view typing remains available on the controller returned by
`useCreateCalendar` and when that controller is passed explicitly. Version 0.1.0
does not include a separate typed-context factory.

### Controlled and uncontrolled state

React options follow standard controlled/uncontrolled conventions:

- `date` / `onDateChange`
- `defaultDate`
- `view` / `onViewChange`
- `defaultView`

Supplying `date` or `view` makes that field controlled. A controlled value must
be reflected immediately when props change, including browser back/forward
navigation. The hook must not mutate controller options during render or retain
the initial timezone and view geometry after props change.

## Error behavior

TypeScript prevents invalid configuration where possible. JavaScript consumers
receive synchronous, descriptive errors for:

- no configured views;
- a default, controlled, or requested view that is not configured;
- non-positive slot durations;
- a day end that is not after its day start;
- items supplied without `getDate`;

Temporal remains responsible for validating dates, times, durations, calendars,
and timezone identifiers. The library does not catch and rewrap Temporal errors
unless additional calendar-specific context materially improves the message.

## Public API cleanup

The v1 public surface removes parallel or accidental abstractions:

- Replace `Calendar` plus `CalendarInstance` with one item-agnostic
  `CalendarController` type.
- Remove `createCalendarAccessor`; plain functions infer correctly at their call
  site.
- Remove `createCalendarViews`; the `views` value is inferred directly.
- Replace `useView` with `useCalendarView` to make its relationship to context
  explicit.
- Remove the unused `getEnd` accessor until the library has an explicit interval
  segmentation contract.
- Stop exporting internal helpers such as `functionalUpdate`.
- Move general formatting, timezone conversion, and current-time helpers to
  `@gobrand/tiempo` rather than duplicating them here.
- Keep low-level month/week/day projection functions in the core package.

The intended public runtime exports are:

- Core: `createCalendar`, `buildMonthView`, `buildWeekView`, `buildDayView`, and
  `getWeekdays`, plus their public controller, options, range, view-model, and
  projection types.
- React: the core surface plus `useCreateCalendar`, `CalendarProvider`,
  `useCalendar`, and `useCalendarView`.

All other current runtime exports are removed or moved to `@gobrand/tiempo`.
Migration work must update every affected `tanstack-start` call site before the
obsolete exports are deleted. Compatibility wrappers must not preserve the
broken `CalendarInstance` type model internally.

## Package and documentation requirements

- The React package must preserve its `"use client"` directive in published ESM
  output.
- Published packages must not contain test declarations.
- CI must typecheck core, React, demo, website examples, and packed-package
  consumer fixtures.
- Type fixtures must import the emitted package declarations, not source files.
- README and website examples must compile without casts or explicit generic
  arguments on the simple path.
- The generated agent skill must contain a complete compiling simple example and
  a complete Suspense example.
- Documentation generation must not write into a user's home directory as an
  implicit side effect. Installing a global skill is a separate explicit action.
- The demo must exercise the released API rather than serving as uncompiled
  historical code.

## Testing strategy

### Runtime behavior

- Preserve existing month/week/day invariants and DST boundary coverage.
- Add timezone-specific tests for initial date, `today()`, `isToday`, and visible
  ranges.
- Add controlled React rerender tests for date, view, timezone, and view geometry.
- Add Suspense integration tests proving that navigation controls remain mounted
  while active-view content shows its fallback.
- Test month and week projections using different item types under one provider.
- Test empty, invalid, and JavaScript-only configuration paths.

### Type behavior

Emitted-declaration fixtures must prove:

- the simple path infers the item type without a generic argument;
- configured view names narrow `activeView` and direct controller methods;
- advanced month and week calls infer independent item types;
- context consumers cannot supply a forged item generic;
- unconfigured view names fail;
- empty view configuration fails;
- missing item accessors fail when items are supplied;
- documented examples compile as written.

Negative assertions must use compiler-enforced expected errors so a test fails if
an invalid program starts compiling.

### Distribution behavior

- Build both ESM and CJS packages.
- Inspect packed contents and module resolution from fresh fixture projects.
- Verify React Server Component consumers see the client boundary.
- Run formatting and lint checks in CI.
- Keep production dependency audit findings for published packages distinct from
  demo and documentation application findings.

## Migration strategy

This is a deliberate breaking release while the packages remain pre-1.0.

1. Establish package, app, and emitted-type verification gates.
2. Implement the item-agnostic controller and pure projections in core.
3. Implement React simple mode over those projections.
4. Implement provider plus advanced `useCalendarView` composition.
5. Migrate `tanstack-start`, beginning with its simple plain-date calendar and
   then its Suspense calendar screens.
6. Migrate the demo, website, README, `llms.txt`, and generated agent skill.
7. Remove obsolete exports and publish as `0.1.0` after downstream verification.

No npm release is implied by implementing this design. Release remains a
separate explicit action.

## Acceptance criteria

The design is complete when all of the following are true:

1. A simple month calendar can be written without generics, factories, a
   provider, or casts.
2. Calendar controls can live above a Suspense boundary while the active view
   owns a Suspense query below it.
3. Month and week views under one controller can project unrelated item types.
4. Context exposes no item generic.
5. Controlled props synchronize on rerender without effects in consumer code.
6. All today/range calculations honor the configured timezone.
7. Visible ranges are half-open and use `end`.
8. The demo, docs, agent examples, and emitted package fixtures compile.
9. Existing invariant and DST tests remain green.
10. The published React entry preserves `"use client"` and excludes test
    declarations.
