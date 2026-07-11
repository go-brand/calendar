# Calendar Site Experience Design

**Status:** Approved for implementation

**Date:** 2026-07-10

**Scope:** Calendar view shorthand, source-backed examples, documentation experience, and landing page

## Summary

The Calendar website should help humans and coding agents build correct calendars when the underlying bug is difficult to locate: timezone leakage, daylight-saving transitions, inclusive range ends, mismatched controlled state, or data fetching coupled to calendar state.

The site will remain Calendar-first. `@gobrand/tiempo` appears once as a concise companion recommendation for general date and timezone utilities; Calendar examples remain self-contained and do not use Tiempo.

Examples will adopt shadcn's open-source presentation architecture rather than adding an in-browser editor. A real compiled example component is the single source for both the rendered preview and displayed code. The preview renders first, followed by a short highlighted source excerpt with copy and expand/collapse controls. Large page-level examples may use an iframe; Calendar's ordinary examples render directly.

## Goals

1. Explain what Calendar owns and why Temporal eliminates common calendar failure modes.
2. Make the first useful React calendar obvious without empty configuration objects, factories, explicit generics, or duplicated example source.
3. Let users interact with real compiled examples while reading the exact code that powers them.
4. Reuse the same example registry on the landing page and in documentation.
5. Give coding agents stable, complete source examples plus direct access to `llms.txt` and the generated Calendar skill.
6. Demonstrate timezone, DST, and half-open range behavior instead of only claiming correctness.
7. Keep Calendar independent from Tiempo while mentioning Tiempo once for adjacent utility needs.

## Non-goals

- Building a browser-based TypeScript compiler or arbitrary code editor.
- Making Tiempo a dependency of Calendar examples.
- Recreating shadcn's Next.js registry implementation verbatim.
- Shipping a styled production calendar widget from the library.
- Turning the Calendar website into an umbrella GoBrand Temporal-toolkit site.
- Adding a general sandbox hosting service.

## View configuration shorthand

Empty view objects currently express only that a view is configured. The public API will make that intent explicit:

```tsx
const calendar = useCreateCalendar({
  views: {
    month: true,
    week: true,
  },
})
```

Custom geometry remains an object:

```tsx
const calendar = useCreateCalendar({
  views: {
    month: true,
    week: {
      dayStart: Temporal.PlainTime.from('08:00'),
      dayEnd: Temporal.PlainTime.from('18:00'),
      slotDuration: Temporal.Duration.from({ minutes: 30 }),
    },
  },
})
```

The rules are:

- A present key configures the view.
- `true` selects default geometry.
- An object supplies custom geometry.
- An omitted key makes the view unavailable.
- `false` is rejected rather than adding a second disabled-state representation.
- Inputs normalize once when the controller is created. Controller and projection internals consume canonical object configurations, not `true | object` unions.
- Exact configured-view inference remains based on present keys, so `setView` and `activeView` keep their current narrowing.

`month` accepts `true` because it has no view-local options in v1. `week` and `day` accept `true | TimedViewConfig`. Empty timed-view objects may remain structurally accepted for compatibility, but all first-party examples use `true` for defaults.

## Source-backed example architecture

The existing `Preview` accepts a rendered child and a manually maintained code string. That permits rendered behavior and displayed source to drift. The replacement follows shadcn's separation of responsibilities while fitting TanStack Start and Fumadocs.

### Example files

Each example is a real, focused TSX module that exports the rendered example. It contains no preview chrome and no duplicated source string.

Examples cover:

- minimal month calendar;
- week calendar;
- week calendar with slots;
- day calendar;
- multi-view calendar;
- Suspense with controls outside the boundary;
- DST/range behavior lab.

### Registry

A typed registry maps a stable example name to:

- the compiled React component;
- the same TSX file imported through Vite's `?raw` source import;
- title and description;
- preview layout metadata such as alignment or minimum height.

The registry is the only lookup surface used by the preview component. MDX pages reference examples by stable name rather than importing implementation-specific wrappers.

### Preview chrome

The preview component receives a registry name and renders:

1. the compiled example in a bordered preview region;
2. a three-line highlighted source excerpt;
3. a gradient and **View code** action over the excerpt;
4. the full highlighted source when expanded;
5. **Copy** and **Collapse** controls;
6. responsive behavior that keeps the live example primary on small screens.

Fumadocs' existing `DynamicCodeBlock` remains the syntax-highlighting implementation. The site will not add a parallel tokenizer or copy shadcn's Shiki wrapper. Vite raw imports provide the source string at build time.

### Interactivity

Examples are real client components. Navigation, view switches, date selection, timezone selection, week starts, or slot-duration controls execute normally inside the preview. Because the displayed source is the exact module being rendered, interactions cannot drift from the code users copy.

The first release will not rewrite source text dynamically when controls change. The code shows the implementation, while controls demonstrate its runtime behavior.

## Landing page narrative

The landing page has one job: convince a developer with a difficult calendar bug that Calendar provides a smaller, more trustworthy boundary.

### 1. Hero: the useful result

- Lead with a plain claim about building timezone-correct calendars with Temporal.
- Show a live, navigable month/multi-view example beside the minimal source-backed setup.
- Primary action: **Start building**.
- Secondary action: **Read the architecture**.
- Installation command remains immediately copyable.

### 2. Why calendar bugs hide

Explain four common sources of bugs:

- host timezone leaking into “today”;
- DST days assumed to be 24 hours;
- inclusive range ends duplicating boundary data;
- data fetching tied to calendar controller state.

Each problem maps directly to a Calendar contract rather than generic marketing copy.

### 3. Interactive Temporal range lab

A compact live lab lets the user choose a representative timezone and date. It displays:

- local start;
- `end`;
- elapsed hours for the local day;
- current offset and any offset change;
- the query predicate `>= start` and `< end`.

Spring-forward and fall-back presets visibly demonstrate 23-hour and 25-hour calendar days. The lab uses `@js-temporal/polyfill` directly and introduces no Tiempo dependency.

### 4. Architecture: state knows time, views know data

Show the item-agnostic controller and local projections as a compact flow:

```text
CalendarController -> visible range/navigation
                  -> MonthView<Summary>
                  -> WeekView<Meeting>
                  -> DayView<Booking>
```

This section links to simple mode, Suspense composition, and independent item-type examples.

### 5. Learn through live examples

Feature three source-backed examples on the landing page:

- minimal month;
- Suspense/data fetching;
- timezone/DST range lab.

The complete example catalog remains in documentation.

### 6. Humans and agents

Provide direct links to:

- installation and quick start;
- full API documentation;
- examples;
- `llms.txt`;
- the generated Calendar skill.

Copy should explain that these artifacts contain the same compiling examples as the site.

### 7. Tiempo companion mention

Tiempo appears once after the Calendar boundary is clear:

> Fighting timezone or DST bugs? Try `@gobrand/tiempo`—familiar, date-fns-style utilities built on Temporal for timezone-safe date math.

The line links to `https://eng.gobrand.app/tiempo`. It does not appear inside Calendar code examples or installation commands.

## Documentation structure

Documentation remains split between React and Core, with React as the primary learning path.

### React path

1. Installation
2. First calendar
3. Views and navigation
4. Data and projections
5. Suspense and per-view queries
6. Timezones and visible ranges
7. Controlled state and routing
8. Complete examples
9. API reference

### Core path

1. Installation
2. Controller
3. Projections
4. Visible-range contract
5. Utilities
6. API reference

Pages prefer runnable examples before exhaustive types. Every page that introduces behavior includes at least one source-backed preview or a compact code example derived from the same public API.

## Visual direction

The visual language should feel like a precise time instrument rather than a generic component-library landing page.

- Use calm neutral surfaces with one cool Temporal accent and restrained status colors.
- Use calendar/range structure—grid lines, range brackets, offsets, and local-time labels—as meaningful visual grammar.
- Keep the live example as the hero's dominant object.
- Avoid decorative gradients, floating badges, generic feature-card repetition, and animation that does not teach behavior.
- Motion is reserved for calendar navigation, code expansion, and DST/range state changes.
- Respect reduced-motion preferences, keyboard interaction, semantic headings, focus visibility, and mobile layouts.

## Agent-facing requirements

- `llms.txt` contains the view shorthand and all canonical examples.
- The generated Calendar skill contains the minimal, Suspense, independent-item, timezone, and controlled-state patterns.
- Source-backed examples compile in the website typecheck.
- Code shown on the website comes from the compiled example module.
- Descriptions explicitly name half-open range semantics and the configured timezone boundary.
- Links and headings use stable language that agents can search for directly.

## Verification

- Core and React unit/type tests cover `true` defaults, custom objects, omitted views, and rejected `false` values.
- Packed-package fixtures compile the shorthand from emitted declarations.
- Every registry entry resolves to both a component and raw source.
- Preview chrome has focused tests for collapsed, expanded, copy, and missing-entry behavior where practical.
- Website typecheck and production build compile all examples.
- Browser verification checks the landing page, docs preview expansion/copy, calendar interaction, range-lab presets, responsive layout, keyboard focus, and reduced motion.
- Generated docs, `llms.txt`, and the Calendar skill are regenerated and validated.

## Delivery boundary

This work updates the current unreleased Calendar `0.1.0` branch. It does not publish packages, deploy the website, or change Tiempo. TanStack Start consumers are updated only where the new `true` shorthand changes already-migrated Calendar configuration.
