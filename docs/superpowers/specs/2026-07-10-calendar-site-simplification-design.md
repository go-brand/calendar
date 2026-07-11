# Calendar Site Simplification Design

**Date:** 2026-07-10
**Status:** Approved

## Goal

Make Calendar examples read like Calendar code rather than CSS demonstrations, and simplify the public landing page so its hierarchy, colors, and responsive behavior feel consistent with the original site.

## Example architecture

Example files will import small presentation-only components from a neighboring `calendar-ui` module. These components are not exported by `@gobrand/react-calendar`; their import path makes it explicit that consumers should replace them with their own design system.

The shared module will provide the smallest useful vocabulary:

- `Button` for example navigation and view controls;
- `Calendar` for the bounded calendar surface;
- `CalendarToolbar` for the title and previous/next controls;
- `CalendarWeekdays` for the visible-range-derived weekday labels;
- `CalendarRow` and `CalendarCell` for month/week geometry;
- `CalendarEvent` for projected items;
- focused timeline primitives only where day/week slot examples require them.

Presentation state such as muted adjacent-month cells, today, selected view, and event styling will be expressed through named props rather than `className` strings. The primitives own Tailwind classes and accessibility details. The example modules continue to own Calendar state, queries, projections, and iteration so the code still teaches the real API.

The source-backed registry remains unchanged in principle: the displayed source is the exact compiled example module imported with Vite `?raw`. It will intentionally show imports from `./calendar-ui` without inlining the presentation implementation.

## Landing structure

The landing page becomes a single vertical story:

1. A compact title, concise description, installation command, and documentation action.
2. A bounded live Calendar preview below the title.
3. Expandable source below that preview in the same independent row.
4. Three concise Temporal/Calendar benefits.
5. A smaller DST range demonstration.
6. Human and agent learning links followed by the existing one-line Tiempo mention.

The current side-by-side hero, bug table, decorative architecture tree, and repeated large section treatments will be removed or collapsed into this simpler sequence.

## Visual direction

Restore the original site language:

- default Fumadocs neutral page background;
- neutral-900 surfaces and neutral borders;
- sky/cyan as the only primary accent family;
- ordinary site typography with a restrained responsive type scale;
- the calendar demo as the one colored surface, using the original sky-to-cyan treatment;
- no page-wide grid pattern, green-tinted background, violet endpoint accent, or oversized condensed display face.

Spacing and borders provide structure. Decorative effects are limited to a subtle cyan treatment behind the main live example.

## Expansion and responsive invariants

- Source expansion only adds vertical space beneath its own preview.
- No title, description, neighboring column, sidebar, or navigation element changes width or position when source expands.
- Landing content uses bounded single-column rows with `min-width: 0` at every grid/flex boundary.
- The page itself has no masked or horizontal overflow at 390px and wider viewports.
- Calendar content may use an internal horizontal scroller only when a time-grid cannot remain legible otherwise.
- Expanded code has a bounded height with its own vertical scroll for long files.
- Collapse and copy controls remain keyboard accessible and do not overlap code on narrow screens.
- Reduced-motion behavior and visible focus styling remain intact.

## Documentation behavior

Docs pages continue to use the same source-backed `CalendarPreview`. Simplifying examples automatically simplifies displayed source everywhere. Landing and docs may use different outer widths, but expansion behavior is identical and independently contained.

## Verification

Implementation acceptance requires:

- source scans proving example modules no longer contain long presentation `className` strings;
- website and nested demo typechecks/builds;
- source identity checks for every registry example;
- desktop and 390px browser inspection of the landing and at least one docs example;
- expansion and collapse checks confirming surrounding layout coordinates remain stable;
- month navigation and multi-view switching checks;
- console-error and horizontal-overflow checks;
- repository lint, formatting, and diff checks.

## Non-goals

- Exporting styled Calendar components from the headless packages.
- Adding a browser code editor or compiler.
- Replacing the host application's design system.
- Changing Calendar controller, projection, timezone, or range behavior.
- Publishing, deploying, or changing the Tiempo repository.
