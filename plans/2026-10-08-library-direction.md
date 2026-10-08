# Library direction and recursive review decisions

Assessed on 2026-10-08 at `6d6decd`. This supersedes the recommendations, not the reproduction evidence, in `IMPLEMENTATION_REVIEW.md`. It includes independent read-only reviews, a second adversarial pass against each proposed remedy, and maintainer-intent checks.

## Product direction

Make GoBrand Calendar the easiest dependable choice for building headless Temporal month, week, and day interfaces. A coding agent should learn a small set of operations, implement a useful calendar, and verify it without inventing imports or discovering hidden provenance rules.

The existing architecture is a good fit: a controller owns navigation and query ranges; projections map arbitrary application records; React offers one-hook convenience and optional provider/Suspense composition. Preserve that architecture and its progressive learning path. The target is successful use, not a larger API or a better discovery-score screenshot. Being the number-one AI recommendation is an ambition, not a result we can guarantee or measure from this repository alone.

Grounding:

- `docs/superpowers/specs/2026-07-10-calendar-v1-dx-design.md` specifies a small headless engine, inferred types, independent data per view, and both ESM/CJS builds. Styled widgets, event layout, fetch ownership, and native/polyfill switching are non-goals.
- `TODO.md:31` explicitly assigns UTC-to-timezone conversion to the data layer.
- `docs/superpowers/specs/2026-07-12-calendar-agent-ready-domain-design.md` requires honest capability claims and one source of documentation truth.
- Current core has five value exports: `createCalendar`, three view builders, and `getWeekdays`.

## Decision rule

For every proposal, ask: what concrete task becomes easier; does existing intent already explain the behavior; can documentation fix the misunderstanding; what supported behavior could the change damage; and what check proves a net improvement?

Prefer a small correction that removes a surprise. Reject a new abstraction that merely hides an unclear contract. Treat tests as executable product promises: do not convert an opinion into a regression test and then call the implementation wrong.

## Every original finding reconsidered

| Finding | Decision | Why this improves the product | What must not get worse |
| --- | --- | --- | --- |
| External core controllers do not update React consumers | Accept a bounded repair, conditional on characterization tests | Public types already accept these controllers; removing support creates another provenance rule | Hook-owned controlled state, transitions, SSR, cleanup, and Suspense behavior |
| React controller/action identity changes | Reject a stable-identity rewrite | Normal current-render actions and dependency-aware subscriptions work; replacement supports immediate prop/config reflection | Do not add forwarding facades, refs, or render-time shared mutations just to support an old captured callback |
| Event timezone differs from controller timezone | Reject automatic normalization; clarify both accessors | Data-layer conversion is recorded intent; explicit mappings preserve arbitrary item semantics | Never override `getDate` using `getStart`, silently convert only one accessor, or add a conversion option/helper |
| Item-bearing React result crashes in core builders | Accept minimal internal repair | A value typed as a controller should work with the exported builders | No public unwrap/registration API and no mutation of shared `activeView` during render |
| 25-hour slot duration wraps to hourly geometry | Defer a narrow input-contract patch | Real boundary issue, low frequency; supported duration semantics must be stated first | Preserve ordinary intraday slots and current 24-hour behavior; do not add elapsed-time/DST scheduling |
| CJS declarations resolve as ESM | Accept | Both formats are an explicit supported contract; correcting the declarations adds no consumer concepts | Keep bundler/ESM consumers, existing inferred types, and runtime exports working |
| Broken pnpm release pin | Accept first | No dependable contribution/release loop exists while the selected tool refuses to run | Do not conflate build-tool requirements with the library's consumer runtime floor or silently reduce Node test coverage |
| Reordered `views` leaves old `viewNames` order | Defer as a small consistency patch | Low practical impact; order can be included in the existing signature if pursued | Reordering must not reset an otherwise valid active view or date |
| Default last-nanosecond event lacks a slot | Defer as a small boundary patch | Real precision issue, but lower value than incorrect published instructions | Keep explicit `dayEnd` exclusive and avoid double-assigning events at ordinary slot boundaries |

For later slot work, prefer positive intraday time durations with a documented maximum and no calendar units, but verify compatibility before rejecting previously accepted values. An omitted full-day end and an explicitly supplied exclusive end must remain distinguishable internally; no new public option is required.

## Higher-value issues found while testing the recommendations

| Finding | Evidence | Decision and benefit | Effort / risk / confidence |
| --- | --- | --- | --- |
| The utility reference advertises 16 absent exports | `apps/www/content/docs/core/utilities.mdx:40`; runtime exports in `packages/core/src/index.ts`; an AST-assisted import audit confirmed the count | Correct docs; use Temporal/controller recipes instead of adding 16 functions to rescue stale prose | S / low / high |
| Agent Markdown omits the actual example code | Nine unresolved `CalendarPreview` tags in `apps/www/public/llms-full.txt`; generator appends raw MDX at `scripts/generate-docs.ts:406` | Publish source and support files through a small explicit manifest; make each example learnable without opening the browser preview | M / low-medium / high |
| Passing fixtures do not validate published examples | `fixtures/package-consumer/tsconfig.json:11` lists three copied fixtures; generator tests check structure and repeatability | Compile the source actually served to readers against packed packages, retain negative type tests, and gate generated drift | M / medium / high |
| Property tests mostly prove legacy builders | `packages/core/src/invariants.test.ts:4–6` | Transfer the relevant behavioral laws to the public projections; keep useful shared range/DST tests | M / low / high |
| Runtime store dependencies are unused | Both package manifests declare TanStack stores; source search finds no imports | Remove separately once React integration design is settled; keep the Temporal polyfill | S / low / high |

The skill generator also labels every documentation page as a “Function” and guesses call syntax from its title (`scripts/generate-docs.ts:312–324`). Replace that with linked documentation sections plus a small truthful API map. Do not invent callable APIs from prose headings.

## Why the initial fixes needed another pass

### Controller subscriptions

Blindly adding `useSyncExternalStore` to every consumer is not safe enough. The hook-owned controller mutates proposed state before invoking controlled callbacks and scheduling its reset. A new subscriber could observe a rejected date or query for it. External-store updates also have different transition/Suspense behavior; [React documents these limitations](https://react.dev/reference/react/useSyncExternalStore#caveats).

Characterize those cases first. The conservative candidate records React-created raw controllers in private React-local metadata. Consumer hooks call an internal subscription hook unconditionally; React-owned instances use a constant snapshot and no-op subscription, while external instances subscribe to a stable primitive date/view snapshot. A no-op subscription alone is insufficient if the snapshot still reads transient mutable state. Preserve the current hook state model. If this cannot stay small and pass the controls, stop at the proven wrapper repair and retain the external-controller finding as deferred.

### Wrapper metadata

Prefer a bounded lookup of the object and its immediate prototype in the existing metadata WeakMap. That matches the actual one-layer `Object.create(calendar)` wrapper. A private inherited symbol is possible, but changes every controller's representation without a demonstrated need. Reject recursive prototype traversal, controller cloning, public unwrapping, and attaching changing `activeView` to a shared object during render. Neither approach promises arbitrary structural or multi-layer decorated controllers.

### Documentation

Replacing `<CalendarPreview>` with only its entry file still leaves incomplete examples. The examples depend on `calendar-ui`, `mock-data`, `@/lib/cn`, optional styling, and—in the Suspense case—a `QueryClientProvider` installed in the website root. Publish the complete functional dependency set or explicitly label the code as a contextual excerpt with links to it. Do not claim production accessibility or identical styling from a successful compile.

Use an explicit finite source manifest, not an MDX execution engine or recursive import crawler. Keep shared presentation code out of the short learning path and deduplicate it in the full corpus. Compiled source bytes and published source bytes must be the same.

### Tooling and release checks

Both `pnpm@11.12.0` and `@pnpm/exe@11.12.0` are deprecated as broken in registry metadata. `11.13.1` was verified nondeprecated during this audit and is a minimal fixed 11.x candidate; ordinary pnpm requires Node >=22.13. Verify the actual installation mode before changing the Node matrix. A supported pnpm 10 release is also a credible alternative: do not claim the existing workspace settings inherently require 11.

Adding docs generation to release checks can dirty generated files after the script's initial clean-tree check. Require a second cleanliness check after validation and before version mutation. Do not auto-stage generated changes into a release bump. Tagged CI remains the final validation of the bumped artifacts.

## Recommended sequence

1. **006: Restore a compatible, reproducible verification loop.** Include existing docs tests and a committed-generation drift check without reducing consumer coverage.
2. **007: Make published guidance truthful and examples available to agents.** Correct nonexistent exports, explain mapping ownership, publish portable source, and compile it.
3. **008: Repair only the proven React interoperability boundaries.** Wrapper repair first; external subscriptions only after controlled/Suspense controls pass.
4. **009: Match declarations to existing module entrypoints.** Verify actual packed consumers and the promised React peers using a small targeted matrix.
5. **010: Put behavioral laws on the public API and measure learning.** Tests stay deterministic; AI task comparisons are an optional bounded experiment.

006 is the verification prerequisite. 007, 008, and 009 can be delivered separately; they must carry their own regression tests. 010 is not a reason to delay the fixes. Keep every change independently reviewable. Plan selection follows the user's request for autonomous recursive evaluation; this is advisory work, not permission to publish a release.

## Measure progress toward the AI recommendation goal

Use five concrete tasks: an arbitrary-record month calendar; a data-free picker; a typed month/week/day switch; a UTC-backed local-date calendar and half-open query across DST; and controls above Suspense with independent view data. Hold out variants such as different record field names and a date crossing midnight in the display zone.

Record package version, documentation commit, model/version, prompt, allowed context/tools, first-pass compile success, behavioral success, invented imports, correction attempts, and retrieved document/token volume. Compare the same tasks and conditions before/after documentation changes, including failures. A small repeated sample is enough to identify confusion; it is not a market-share or recommendation-ranking benchmark. Do not add paid model calls or nondeterministic scoring to release CI.

The desired progression is discover → understand → implement → verify with fewer errors and less reading. Existing `llms.txt`, Markdown negotiation, and skill discovery provide access; accurate code and clear contracts make that access useful.

## Explicitly rejected or deferred expansion

- No “AI-specific” runtime API, MCP/A2A service, plugin system, event schema, accessor factory, or typed-context factory solely for discoverability.
- No restored formatting/layout/navigation exports solely to match stale docs.
- No runtime native/polyfill switching in this work; the current polyfill boundary is intentional.
- No styled UI kit, recurrence engine, drag/drop, collision layout, event-end segmentation, or fetching/cache ownership in this improvement batch.
- No broad dependency update or state-store migration. Removing truly unused runtime dependencies is a later isolated cleanup.
- No blanket performance optimization or coverage-percentage target without an observed task-level problem.
- No claim that scanner scores, training permissions, schema metadata, or a small model evaluation guarantee recommendation rank. No crawler-policy change is proposed.

## Scope and limits

This pass reviewed current core/React implementation, design history, public docs/examples, generated agent material, and package/test/release boundaries. Earlier runtime probes were reused where the underlying source had not changed; new source/registry checks verified the additional documentation and tooling evidence. It did not execute proposed fixes, run a live AI evaluation, deploy the website, inspect every transitive vulnerability, benchmark performance, or establish native-Temporal compatibility. Only planning files are changed in this pass.
