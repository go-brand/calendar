# Calendar View DX and Progressive Examples Design

**Date:** 2026-07-12
**Status:** Approved

## Goal

Make the public view model read naturally and make the documentation feel easy
before it introduces advanced composition. The first example must teach one
small, useful calendar. Later examples must each solve one recognizable product
case instead of combining multiple advanced techniques.

## Public API changes

### View model name

Every library-produced month, week, and day view model gains a required literal
`name` field:

```ts
type MonthView<TItem = never> = {
  name: 'month'
  /** @deprecated Use `name`. */
  view: 'month'
  weeks: CalendarWeek<TItem>[]
  month: Temporal.PlainYearMonth
}
```

`WeekView` and `DayView` receive the corresponding literal names. Both core
projection functions and React projections return `name` and the compatibility
`view` alias. `ActiveView` continues to be a discriminated union, but repository
code narrows it with `name`:

```tsx
switch (view.name) {
  case 'month':
    return <MonthCalendar month={view} />
  case 'week':
    return <WeekCalendar week={view} />
  case 'day':
    return <DayCalendar day={view} />
}
```

The existing `view` field remains required for compatibility and is marked
deprecated in the public types. Compatibility tests verify both fields while
all READMEs, website examples, generated documentation, skills, fixtures, and
normal tests use `name`.

### Typed configured-view enumeration

`CalendarController<TViews>` gains:

```ts
readonly viewNames: readonly ConfiguredView<TViews>[]
```

The names retain the caller's configured-view order. This removes the unsafe
cast currently required to render a view switcher:

```tsx
calendar.viewNames.map(name => (
  <button key={name} onClick={() => calendar.setView(name)}>
    {name}
  </button>
))
```

`calendar.views` remains the keyed resolved-configuration object. `viewNames`
is its typed enumeration surface; it does not introduce a second configuration
source.

### Visible range boundary

`VisibleRange` remains exactly:

```ts
type VisibleRange = {
  start: Temporal.ZonedDateTime
  end: Temporal.ZonedDateTime
}
```

There is one range convention throughout the library: `start` is inclusive and
`end` is exclusive. Because there are no competing boundary modes, the simple
name `end` is preferable. Documentation explains the half-open convention at
the range boundary instead of encoding it into every property access.

## Example learning path

### Principal example: basic month with events

The npm README, React landing page, generated Calendar skill, and first-calendar
guide lead with one month view, one hook, and one accessor:

```tsx
const calendar = useCreateCalendar({
  views: { month: true },
  items: events,
  getDate: event => event.date,
})

const month = calendar.activeView
```

The example includes navigation and renders real month data. It does not use
`getStart`, context, Suspense, TanStack Query, multiple views, timed slots, or
undefined presentation helpers. `getDate` remains because arbitrary event
records need an explicit mapping to a calendar day.

The live `basic-month` example follows the same contract and removes its unused
`getStart` accessor.

### Date picker

A dedicated month-only date-picker example demonstrates a calendar without
event data. It uses the existing data-free controller and projection API,
compares each day with `calendar.date`, calls `setDate`, and provides previous,
next, and today navigation. It introduces no item accessors or data fetching.

This design does not change `useCreateCalendar` to always compute an
`activeView`; preserving the item-agnostic controller keeps the Suspense path
cheap and explicit.

### Month with events

The basic month is also the canonical date-grouping example. It uses only
`getDate`. It does not pass `getStart`, because month cells do not require timed
placement.

### Multi-view calendar

The multi-view example teaches only view switching and union narrowing. It uses
local event data, `calendar.viewNames`, `calendar.setView`, and `view.name`.
It does not fetch under Suspense. Its local rendering components are named
`MonthCalendar`, `WeekCalendar`, and `DayCalendar`, avoiding aliases such as
`MonthViewModel` for the exported model types.

### Timed week and day

Timed examples are the first place to use both accessors:

```ts
getDate: event => event.startsAt.toPlainDate(),
getStart: event => event.startsAt,
```

They demonstrate real time-slot placement, custom day geometry, and timezone
behavior. Simple week rendering stays separate from the timed-slot example.

### Suspense query calendar

A dedicated month-only example demonstrates `CalendarProvider`, `useCalendar`,
`useCalendarView`, `visibleRange`, TanStack Query, and a Suspense boundary. The
controller and controls stay above the boundary; fetching and projection stay
below it. It does not also teach multi-view dispatch or timed accessors.

### Controlled and routed state

The existing controlled-state guide remains the focused place for controlled
`date`, controlled `view`, callbacks, and URL synchronization.

## Documentation and generation

The repository's generated surfaces remain synchronized:

- `packages/react/README.md` leads with the basic month example.
- `apps/www/content/docs/(react)/index.mdx` and `first-calendar.mdx` use the
  same basic mental model.
- Example pages and the example registry expose the date-picker, basic month,
  simple week, timed week/day, multi-view, and Suspense-query cases with precise
  descriptions.
- `scripts/generate-docs.ts` produces the same principal example in
  `skills/calendar/SKILL.md`.
- Package-consumer fixtures compile the generated examples and exercise the new
  `name` and `viewNames` types.
- Generated website artifacts such as `llms.txt` are refreshed when their
  source content changes.

Website-only UI components remain website-only and are never presented as
package exports.

## Error handling and compatibility

No new runtime error states are introduced. Existing validation for empty or
unsupported view configurations remains unchanged.

Adding required `name` and `viewNames` fields is source-breaking only for
consumers that manually construct exported structural types. This is accepted
for the current young package. Existing consumers reading `view.view` or
`visibleRange.end` continue to work at runtime and in TypeScript.

## Verification

Implementation is complete when:

1. Core projection tests verify matching `name` and deprecated `view` values for
   month, week, and day.
2. Controller tests verify the exact typed/runtime order of `viewNames`.
3. React tests narrow `activeView` and `useCalendarView` results with `name`.
4. A repository search finds no normal documentation or example use of
   `view.view` or `activeView.view`; only explicit compatibility assertions may
   remain.
5. A repository search finds no `Object.keys(calendar.views)` cast.
6. The principal example contains `getDate` but not `getStart`, Suspense,
   context, or multiple views.
7. `pnpm test --run`, package type checks, package builds, documentation
   generation, packed-package verification, and website build pass.

## Non-goals

- Renaming `VisibleRange.end` or adding `endExclusive`.
- Making assumptions about item property names to remove `getDate`.
- Adding a new active-view hook or making `useCalendarView.view` implicit.
- Combining the principal example with Suspense, queries, timed slots, or
  routing.
- Publishing, releasing, pushing, or deploying as part of this implementation.
