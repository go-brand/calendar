# Plan 010: Verify public calendar behavior and measure learning success

- Status DONE for deterministic checks and evaluation definitions; model runs not executed; priority P2 for public behavior coverage, optional experiment for model evaluation; effort M; risk low; category tests/direction.
- Planned at `6d6decd`, 2026-10-08. Depends on plan 006. Fixes in 007–009 carry their own regressions and do not wait for this plan. Run a before/after learning comparison around 007 when practical.
- Suggested branch `codex/public-calendar-laws`; conventional commits. No production/API changes, deployments, or automatic paid model calls.
- Drift check: `git diff --stat 6d6decd..HEAD -- packages/core/src/invariants.test.ts packages/core/src/core/projections.test.ts packages/core/src/index.ts packages/react/src/v1.test.tsx fixtures/package-consumer`. Reconcile expected predecessor tests rather than duplicating them.

## Why this helps

An AI can make a plausible implementation edit that passes legacy-helper tests while breaking the published projection path. Move confidence toward actual consumer behavior. Separately, measure whether docs help agents complete representative tasks; transport/discovery checks cannot establish learning success or recommendation rank.

Allowed files: tests under `packages/core/src/`, focused existing React/consumer tests only if a promised behavior is not already covered by 008/009, and a small evaluation task/result document under `plans/evaluations/`. Do not alter runtime source, add a test framework, delete legacy builders/tests before equivalent protection exists, or add model-provider SDKs and paid calls to release CI.

## Current facts and conventions

`packages/core/src/invariants.test.ts` imports legacy `buildMonth`, `buildWeek`, and `buildDay`, plus shared date-range helpers. It already uses `@fast-check/vitest`, `fc`, Vitest, and the Temporal polyfill. Reuse these tools and existing bounded generators (1971–2100 years, all seven week starts, valid month days).

Current consumers import `createCalendar` and `buildMonthView`/`buildWeekView`/`buildDayView` from the public entrypoint. Their small example suite is `packages/core/src/core/projections.test.ts`. The v1 design requires independent arbitrary item types and direct Temporal primitives. Date assignment is determined by `getDate`; timed placement is determined by the supplied local time from `getStart`. Data-layer timezone conversion is intentional. Do not encode automatic conversion, stable React identity, or unsupported multi-day slot policy as a supposedly existing law.

## Part A: Public behavioral laws

1. Inventory the existing property groups and mark which still describe the current API. Add public-projection property groups importing `./index` (or the appropriate relative public entrypoint) instead of legacy helper implementations. Adapt old tests rather than duplicating every test.
   - Check month grids contain complete seven-day weeks, start on the configured weekday, contain contiguous dates and every date of the target month exactly once, and correctly identify current-month cells. Cover leap years and non-leap century 2100.
   - Check week projections contain seven contiguous dates and honor every configured week start.
   - Check arbitrary records are retained unchanged and grouped by their supplied date exactly once when visible, including multiple records on the same day and outside-grid records. Use independently shaped data in separate projections of one controller.
   - Check data-free projections need no fake accessor or item type. Verify input arrays/records are not mutated where the contract treats them as inputs.
2. Check ordinary positive intraday geometry with minute-aligned starts/ends and supported durations, including a final clipped slot. An item exactly at an internal boundary belongs to the next slot once; an item at an explicitly exclusive `dayEnd` has no slot and remains in the day's items. Untimed data stays at day level.
   - Do not encode an expected answer for >24-hour/calendar-unit durations or the default final-nanosecond defect until their separate contract patch is selected. They remain recorded findings, not silently accepted behavior.
3. Keep useful shared range/DST tests, and add a small public-controller assertion connecting `visibleRange` to the rendered month/week/day dates. Cover known 23-hour and 25-hour days without using JavaScript `Date` or assuming every day is 24 elapsed hours.
   - Where current time matters, use deterministic Temporal values or mock the appropriate Temporal.Now method. Avoid tests whose result depends on crossing midnight during execution.
4. Verify the laws can detect a meaningful defect: temporarily change a scoped projection boundary/weekday calculation locally, run the relevant group and confirm failure, then restore that exact edit. Do not commit the mutation or overwrite unrelated edits. Preserve the reported seed/path for any unexpected fast-check failure.
5. After replacement coverage passes, decide whether redundant legacy property groups can be retired in a separate cleanup. Do not mix removal of legacy implementation modules or unused dependencies into this plan.

Commands: `pnpm --filter @gobrand/calendar-core test invariants --run`, `pnpm --filter @gobrand/calendar-core test projections --run`, then `pnpm test --run`, `pnpm typecheck`, and `pnpm lint`; all exit 0. No coverage-percentage gate is required.

## Part B: Small optional learning evaluation

Create five task definitions with behavioral oracles and allowed documentation entrypoints. Keep the application shell and testing harness fixed so styling/framework setup does not dominate the result:

| Task | Success criteria |
| --- | --- |
| Arbitrary-record month calendar | Inferred item type, valid month grid, two navigation actions work, records appear on supplied dates |
| Data-free date picker | No fake item/accessor, selected PlainDate returned, navigation and selection work |
| Typed multi-view calendar | Only configured views allowed; correct narrowing and independent view data where requested |
| UTC-backed local-date calendar/query | Both mappings use the same explicit display zone; date-crossing records land correctly; query uses `>= start` and `< end` across a known DST transition |
| Suspense composition | Controller/controls remain mounted and usable while view data loads; data maps after resolution; required query provider/bootstrap is present |

Record package version, docs commit, model identifier/version, task prompt, context/tools, first-attempt compilation, behavioral checks, nonexistent imports, correction turns, and retrieved token/document volume where available. Include held-out variants (different record fields, another week start, a local-midnight crossing). For a before/after comparison hold model, task shell, retrieval policy, and attempt budget fixed; repeat enough to expose obvious variance and report the actual small sample size.

A proposed initial run is three attempts per task per condition, subject to the operator's available model tooling/budget. This is a diagnostic sample, not a statistically established ranking. Do not invoke paid services, choose a new model, or create a benchmark platform automatically. If runs are not available, deliver the task definitions and clearly record evaluation as not executed; do not fabricate a success score or mark the experiment complete.

Keep deterministic task oracles reusable as ordinary tests. Model scores are optional reports, not release gates. A failure should produce a specific docs/API hypothesis; only a repeatable improvement justifies additional runtime concepts.

## Done criteria and stop conditions

- Public projection laws run through exported APIs and cover the contracts listed above.
- Existing range/DST coverage remains, and no new law silently changes timezone ownership, React identity, or duration policy.
- Property tests are reproducible, bounded, and catch a meaningful deliberate boundary mutation.
- Runtime code and public surface are unchanged; all prescribed tests/typechecks pass.
- Five evaluation tasks and their oracles are recorded. Actual model runs are separately marked executed or not executed with honest scope and sample size.

Stop if a proposed law conflicts with current documented intent, if a passing result requires modifying runtime behavior, or if evaluation infrastructure becomes a new subsystem. Report a discovered defect separately instead of changing the test to hide it. Stop before removing legacy protection until the corresponding public path is covered.

Maintenance: add new public behavior to the laws and task set when it becomes supported. Prefer task success and clear contracts over test-count, scanner-score, or “AI-ready” marketing targets.
