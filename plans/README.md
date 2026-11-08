# Implementation Plans

## Current direction review — 2026-10-08

The [recursive decision record](2026-10-08-library-direction.md) assesses every finding from the October review against the existing headless, Temporal-first design and the goal of easy, reliable AI-assisted adoption. It records accepted remedies, counterarguments, rejected API expansion, and deferred edge cases. The five plans have now been implemented on `codex/calendar-reliability`; the original decision record remains the rationale for their scope.

| Plan | Outcome | Priority | Effort | Risk | Depends on | Status |
| --- | --- | --- | --- | --- | --- | --- |
| [006](006-restore-verification.md) | Compatible tooling, full runtime coverage, docs/release verification | P1 | S | Medium | — | IMPLEMENTED — local Node 20/22 passed; remote CI pending |
| [007](007-trustworthy-agent-docs.md) | Truthful public guidance and usable, checked example source | P1 | M | Medium | 006 | DONE |
| [008](008-preserve-react-composition.md) | Bounded core/React interoperability repairs | P2 | M | Medium | 006 | DONE |
| [009](009-verify-package-contracts.md) | Correct dual-format declarations and packed-consumer contracts | P2 | S/M | Low–medium | 006 | DONE |
| [010](010-public-behavior-and-learning-checks.md) | Public projection laws; optional bounded learning evaluation | P2 / experiment | M | Low | 006; compare docs around 007 | DONE — deterministic checks; model evaluation not run |

Execution followed 006 first. 007–009 are independently deliverable, but 007 and 009 share the package verifier and must preserve each other's checks. 008 has its own regression and characterization tests; 010 must not delay a proven fix. The learning evaluation is optional and must be reported separately from deterministic verification.

The user requested autonomous recursive selection, so these five bounded plans were selected by evidence and value rather than expanding every review point into a task. The planning pass made no implementation changes. Subsequent execution implemented the five selected plans; no deployment, release, push, or paid evaluation was performed.

### Implementation evidence

- Verification restored with pnpm 11.13.1, frozen installs, generated-document checks, and isolated release-gate tests. Local Node 20/22 verification passes; actual GitHub Actions/Linux execution remains unverified.
- All seven preview names publish complete source bundles. The consumer verifier compiles 31 exact published snippets and 10 source files against tarballs, checks deliberate invalid cases, and runs 10 example integration checks.
- Core builders accept the React item-bearing wrapper. External controllers update React consumers, with controlled-state, StrictMode, Suspense transition, subscription cleanup, and hydration regressions.
- ESM/CommonJS exports select matching declarations. Packed checks explicitly assert TypeScript 5.7.3 and 5.9.3 and use isolated React 18/19 consumers.
- Public projection laws pass and detected a deliberate exclusive-boundary mutation. Package tests total 189 (162 core, 27 React); docs checks total 25. The [five learning tasks](evaluations/public-calendar-learning.md) are defined; actual model sample size is 0.

Existing host-tool deprecation and website bundle-size advisories remain. These checks do not establish an AI recommendation ranking. Unchanged public APIs, caller-owned timezone normalization, and per-render React controller lifetimes remain intentional.

### Considered and rejected or deferred

- Reject automatic timezone normalization: `TODO.md:31` assigns conversion to the data layer. Document consistent accessors instead.
- Reject a stable-controller/action rewrite: normal React lifetimes work, and the rewrite risks controlled-state and Suspense semantics.
- Reject blanket external-store subscriptions: characterize ownership and preserve the hook-owned path; a constant snapshot is required for the no-op branch.
- Reject public unwrap/registration helpers and recursive prototype traversal to repair the one-layer React wrapper.
- Reject adding nonexistent formatting/layout/navigation exports to make stale documentation look correct.
- Reject AI-specific runtime APIs, MCP/A2A services, native/polyfill switching, or a UI kit in this batch.
- Defer duration-domain validation, the final-nanosecond edge, and live view-order synchronization to small separately justified patches.
- Defer unused TanStack-store dependency removal until the React integration approach is settled; do not add a store merely to justify the dependencies.
- Preserve existing consumer support; package-manager runtime requirements alone do not justify dropping Node coverage or CJS.

## Historical plans — June/July 2026

Plans 001–005 below record work completed against earlier APIs. Their DONE status is historical, not a claim that the current v1 implementation still uses those mechanisms or that current documentation is correct. In particular, 002's TanStack subscription implementation was superseded, and the docs consistency claim in 005 does not cover the later v1 documentation drift addressed by 007.

> Historical audit record. For the current API and examples, use the package READMEs and
> [calendar.gobrand.app/docs](https://calendar.gobrand.app/docs).

Generated by the improve skill on 2026-06-28 (against commit `b081220`).

These plans fix the bugs found in an audit of `@gobrand/calendar-core` and
`@gobrand/react-calendar`. They are written **TDD-first**: every bug plan starts
by adding a test that FAILS against the current code (red), then makes the fix
so the test passes (green). This proves the bug was real and guards against
regression — the audit found these bugs precisely because no test covered them.

Each executor: read the plan fully before starting, honor its STOP conditions,
and update your row in the table when done.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| 001  | Establish a green workspace test & typecheck baseline | P1 | S | — | DONE (test/typecheck/build green; un-excluding tests surfaced latent test-file type errors — fixed in test files via `<TItem, typeof options>`) |
| 002  | Bump TanStack Store to 0.11 and fix React reactivity | P1 | M | 001 | DONE (bumped @tanstack/store 0.8->0.11, added @tanstack/react-store 0.11; useView/useCalendar subscribe to the store via useSelector; 2 red-then-green reactivity tests added; 232 tests/typecheck/build green) |
| 003  | Fix `getTimezoneOffset` for fractional / negative offsets | P2 | S | 001 | DONE (fractional/negative offsets now formatted via signed total-minutes split; Asia/Kolkata -> `+5:30`, America/St_Johns -> `-3:30`, whole hours unchanged; tests added) |
| 004  | Consolidate date-range construction into the `dateRanges` helpers | P2 | M | 001 | DONE (computeDateRange now delegates to getMonth/Week/DayDateRange helpers; behavior-preserving, 3 characterization tests pin the bounds; merged with 001's typed test pattern) |
| 005  | Sync docs, website, and skills with the merged fixes | P3 | M | 002, 003, 004 | DONE (audited react/core MDX + READMEs/TODO against merged 002/003/004 — docs already accurate, no content edits needed; `pnpm generate:docs` re-run clean, llms.txt/SKILL.md already in sync; test/typecheck/build green) |

Status values: TODO | IN PROGRESS | DONE | BLOCKED (one-line reason) | REJECTED (one-line rationale)

## Why 001 comes first

Right now `pnpm test --run` (the command CLAUDE.md documents and CI runs) **fails**
because `apps/demo` has a `test` script but no tests and no vitest config — vitest
loads the app's full Cloudflare/TanStack-Start `vite.config.ts` and crashes. You
cannot trust red/green for any other plan until the baseline is green. 001 also
re-enables type-checking of test files (currently excluded), which is part of a
"proper testing setup": it is why a type-level regression in the public generic
API could ship uncaught.

## Dependency notes

- 002, 003, 004 all require 001 because each relies on `pnpm test --run` being a
  trustworthy green-to-red signal. Run 001 first and confirm it is green.
- 002, 003, 004 are independent of each other and may be done in any order (or in
  parallel by separate executors). They touch disjoint files.
- 005 is LAST and depends on 002+003+004 being merged: it aligns the MDX docs,
  READMEs, and (generated) `llms.txt` + `skills/calendar/SKILL.md` with the new
  behavior. It fans out parallel subagents per doc surface, then regenerates the
  derived artifacts via `pnpm generate:docs`. Docs-only — no source changes.

## Findings considered and deferred

- **Two parallel calendar type definitions** (`Calendar` conditional type vs the
  flat `CalendarInstance` type in `packages/core/src/types.ts:227-295`) can drift,
  and `CalendarInstance.getTitle` types its `view` param as the broad `ViewType`
  rather than the configured-views union. This is type debt, not a runtime bug:
  low user impact, and unifying the two types is risky type surgery that could
  break downstream inference. Deferred — revisit only if the two definitions
  actually diverge in a way users hit.
- **DST-unsafe midnight construction** (`'00:00:00'` may not exist on zones that
  spring forward at midnight) was originally flagged as a bug. In practice
  `toZonedDateTime`'s default `'compatible'` disambiguation shifts the non-existent
  time forward rather than throwing, so there is no crash and no data loss — it is
  an edge-case semantics question, not a runtime bug. Plan 004 centralizes the
  construction into one place (`dateRanges.ts`) so this can be revisited there if it
  ever matters; no behavior change is made now. Not separately planned.
- **`buildDay` excludes events whose start time falls outside `[startHour, endHour)`
  from `timeSlots`** (they remain in the day's `items[]`). This looks like a bug
  but is a reasonable by-design tradeoff for a slot grid; changing it is a feature
  decision (partial-overlap events), not a fix. Not planned.
