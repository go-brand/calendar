# Plan 004: Consolidate date-range construction into the `dateRanges` helpers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat b081220..HEAD -- packages/core/src/core/calendar.ts packages/core/src/utils/dateRanges.ts packages/core/src/core/calendar.test.ts`
> If any changed since this plan was written, compare the "Current state"
> excerpts against the live code; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-test-and-typecheck-baseline.md
- **Category**: tech-debt
- **Planned at**: commit `b081220`, 2026-06-28

## Why this matters

The calendar's date-range logic exists twice. `computeDateRange` inside
`packages/core/src/core/calendar.ts` reimplements, line for line, the month/week/day
range math that already lives in the public, separately-tested
`packages/core/src/utils/dateRanges.ts` (`getMonthDateRange`, `getWeekDateRange`,
`getDayDateRange`). Two copies of the same arithmetic means a future fix or DST
adjustment applied to one will silently miss the other — the classic source of
"it works in `getDateRange()` but not in `calendar.dateRange`" drift. Collapsing
`computeDateRange` onto the shared helpers removes the duplication while keeping
behavior identical. This is a refactor: it must not change any observable output.

Because the goal is "no behavior change," this plan is TDD as a **regression guard**:
first pin the current observable behavior of `calendar.dateRange` / `getDateRange()`
with characterization tests (they pass now), then refactor, then confirm the same
tests still pass.

## Current state

`packages/core/src/core/calendar.ts:17-57` — the duplicated private function:

```ts
function computeDateRange(
  view: string,
  referenceDate: Temporal.PlainDate,
  timeZone: string,
  weekStartsOn: number = 1
): DateRange {
  let start: Temporal.PlainDate;
  let end: Temporal.PlainDate;

  if (view === 'month') {
    const firstOfMonth = referenceDate.with({ day: 1 });
    const lastOfMonth = referenceDate.with({ day: referenceDate.daysInMonth });
    const startDayOfWeek = firstOfMonth.dayOfWeek;
    const daysToSubtract = (startDayOfWeek - weekStartsOn + 7) % 7;
    start = firstOfMonth.subtract({ days: daysToSubtract });
    const endDayOfWeek = lastOfMonth.dayOfWeek;
    const daysToAdd = (weekStartsOn + 6 - endDayOfWeek) % 7;
    end = lastOfMonth.add({ days: daysToAdd });
  } else if (view === 'week') {
    const dayOfWeek = referenceDate.dayOfWeek;
    const daysToSubtract = (dayOfWeek - weekStartsOn + 7) % 7;
    start = referenceDate.subtract({ days: daysToSubtract });
    end = start.add({ days: 6 });
  } else {
    start = referenceDate;
    end = referenceDate;
  }

  const startZoned = start.toZonedDateTime({
    timeZone, plainTime: Temporal.PlainTime.from('00:00:00'),
  });
  const endZoned = end.toZonedDateTime({
    timeZone, plainTime: Temporal.PlainTime.from('23:59:59.999'),
  });
  return { start: startZoned, end: endZoned };
}
```

`packages/core/src/utils/dateRanges.ts` already contains the equivalent logic:

- `getMonthDateRange(date, timeZone, { weekStartsOn, bounds })` — with the default
  `bounds: 'calendar'` it produces exactly the month branch above
  (`dateRanges.ts:13-55`).
- `getWeekDateRange(date, timeZone, { weekStartsOn })` — exactly the week branch
  (`dateRanges.ts:64-88`).
- `getDayDateRange(date, timeZone)` — exactly the day branch
  (`dateRanges.ts:96-110`).

All three apply the same `00:00:00` / `23:59:59.999` zoning. The arithmetic is
identical; this has been confirmed by reading both. The only difference is the
`weekStartsOn` parameter type: `computeDateRange` takes `number`, the helpers take
the `0|1|2|3|4|5|6` union.

`computeDateRange` is called from three places in `calendar.ts`:
- `calendar.ts:76-81` (initial `dateRange` at construction),
- `calendar.ts:149-154` (recompute inside `setStateImpl`),
- `calendar.ts:352-359` (the `getDateRange(view?)` method).

`weekStartsOn` is resolved once at `calendar.ts:71`:
`const weekStartsOn = monthView?.weekStartsOn ?? weekView?.weekStartsOn ?? 1;`

Repo conventions:
- Core tests in `packages/core/src/core/calendar.test.ts`, `vitest`
  `describe`/`it`, importing `createCalendar` from `../core/calendar` (or via the
  package entry). Confirm the exact import line at the top of that file and match it.
- `dateRanges.test.ts` already exercises the helpers directly with `'UTC'` and
  explicit `weekStartsOn` — model assertions on `range.start.toPlainDate().toString()`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Core tests only | `pnpm --filter @gobrand/calendar-core run test --run` | all pass |
| All tests | `pnpm test --run` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope**:
- `packages/core/src/core/calendar.ts` — delete `computeDateRange`'s duplicated
  body, delegate to the `dateRanges` helpers.
- `packages/core/src/core/calendar.test.ts` — add characterization tests for
  `calendar.dateRange` and `calendar.getDateRange(view)`.

**Out of scope** (do NOT touch):
- `packages/core/src/utils/dateRanges.ts` — it is the target of the consolidation;
  it is already correct and tested. Do not modify its behavior or signatures.
- The `23:59:59.999` end-of-day convention — keep it exactly; changing inclusive
  end-of-day semantics is a public-contract change, not part of this refactor.
- Any DST disambiguation behavior — `toZonedDateTime` keeps its default
  ('compatible'). Do not add a `disambiguation` option here (see Maintenance).

## Git workflow

- Branch: `advisor/004-consolidate-date-ranges`
- Conventional commits:
  1. `test(core): characterize calendar.dateRange / getDateRange behavior`
  2. `refactor(core): delegate computeDateRange to dateRanges helpers`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Characterization tests (must pass against current code)

Add a `describe('date range (characterization)', ...)` block to
`packages/core/src/core/calendar.test.ts`. These assert the CURRENT observable
behavior so the refactor can be proven behavior-preserving. Use `'UTC'` to keep
assertions deterministic.

```ts
it('month dateRange matches calendar-grid bounds', () => {
  const calendar = createCalendar({
    views: { month: { accessor: { getDate: (d: { date: Temporal.PlainDate }) => d.date }, weekStartsOn: 1 } },
    timeZone: 'UTC',
    state: { referenceDate: Temporal.PlainDate.from('2026-01-15'), currentView: 'month' },
  });
  const range = calendar.getDateRange('month');
  expect(range.start.toPlainDate().toString()).toBe('2025-12-29');
  expect(range.end.toPlainDate().toString()).toBe('2026-02-01');
  expect(range.start.toPlainTime().toString()).toBe('00:00:00');
});

it('week dateRange spans 7 days from weekStart', () => {
  const calendar = createCalendar({
    views: { week: { accessor: { getDate: (d: { date: Temporal.PlainDate }) => d.date }, weekStartsOn: 1 } },
    timeZone: 'UTC',
    state: { referenceDate: Temporal.PlainDate.from('2026-01-15'), currentView: 'week' },
  });
  const range = calendar.getDateRange('week');
  expect(range.start.toPlainDate().toString()).toBe('2026-01-12'); // Monday
  expect(range.end.toPlainDate().toString()).toBe('2026-01-18');   // Sunday
});

it('day dateRange is the single reference day', () => {
  const calendar = createCalendar({
    views: { day: { accessor: { getDate: (d: { date: Temporal.PlainDate }) => d.date } } },
    timeZone: 'UTC',
    state: { referenceDate: Temporal.PlainDate.from('2026-01-15'), currentView: 'day' },
  });
  const range = calendar.getDateRange('day');
  expect(range.start.toPlainDate().toString()).toBe('2026-01-15');
  expect(range.end.toPlainDate().toString()).toBe('2026-01-15');
});
```

Adjust the accessor/item typing to match how other tests in this file construct
calendars (read the top of `calendar.test.ts` and reuse its fixture pattern if one
exists). The expected dates above were computed from the same logic in
`dateRanges.test.ts` (January 2026 starts on a Thursday; Monday-start grid →
Dec 29 .. Feb 1).

**Verify**: `pnpm --filter @gobrand/calendar-core run test --run` → these new tests
**PASS** against the current, unrefactored code. If any FAIL now, the expected
values are wrong for this codebase — STOP and report; do not refactor on top of a
bad baseline.

### Step 2: Refactor `computeDateRange` to delegate

Replace the body of `computeDateRange` in `packages/core/src/core/calendar.ts:17-57`
so it dispatches to the shared helpers. Import them at the top of the file:

```ts
import { getMonthDateRange, getWeekDateRange, getDayDateRange } from '../utils/dateRanges';
```

New `computeDateRange`:

```ts
function computeDateRange(
  view: string,
  referenceDate: Temporal.PlainDate,
  timeZone: string,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1
): DateRange {
  if (view === 'month') {
    return getMonthDateRange(referenceDate, timeZone, { weekStartsOn });
  }
  if (view === 'week') {
    return getWeekDateRange(referenceDate, timeZone, { weekStartsOn });
  }
  return getDayDateRange(referenceDate, timeZone);
}
```

Note the `weekStartsOn` parameter type tightened from `number` to the
`0|1|2|3|4|5|6` union to match the helpers. The call site at `calendar.ts:71`
already produces that union (it reads `weekStartsOn?: 0|1|...|6` from view options,
defaulting to `1`), so this should type-check. If TypeScript complains that the
resolved `weekStartsOn` is `number`, narrow it at the resolution site (line 71)
rather than loosening the helper types — report if unsure (STOP condition).

Then ensure the old per-branch arithmetic and the local `Temporal.PlainTime.from`
calls inside `computeDateRange` are fully removed (they now live only in
`dateRanges.ts`).

**Verify**:
- `pnpm --filter @gobrand/calendar-core run test --run` → the Step 1
  characterization tests still PASS, and every pre-existing test still passes.
- `pnpm typecheck` → exit 0.

### Step 3: Full regression check

**Verify**:
- `pnpm test --run` → exit 0.
- `pnpm typecheck` → exit 0.
- `pnpm build` → exit 0.

## Test plan

- New characterization tests in `packages/core/src/core/calendar.test.ts` for the
  month/week/day cases of `calendar.getDateRange(view)`, asserting start/end
  `PlainDate` and the `00:00:00` start time.
- These PASS before the refactor (pinning current behavior) and PASS after
  (proving no behavior change) — that is the regression guard for a refactor.
- Structural pattern: existing `createCalendar` tests in `calendar.test.ts` and the
  assertion style in `dateRanges.test.ts`.
- Verification: `pnpm test --run` → all pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm test --run` exits 0; the 3 new characterization tests exist and pass
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm build` exits 0
- [ ] `computeDateRange` no longer contains the duplicated arithmetic:
      `grep -n "daysToSubtract\|daysToAdd" packages/core/src/core/calendar.ts`
      returns no matches
- [ ] `grep -n "getMonthDateRange\|getWeekDateRange\|getDayDateRange" packages/core/src/core/calendar.ts`
      shows the helpers imported and used
- [ ] Only `packages/core/src/core/calendar.ts` and
      `packages/core/src/core/calendar.test.ts` are modified (`git status`)
- [ ] `plans/README.md` status row for 004 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The Step 1 characterization tests do NOT pass against the current code — the
  expected dates are wrong for this repo; report before refactoring.
- After the refactor, any characterization or pre-existing test changes result —
  the consolidation was supposed to be behavior-preserving; a diff means the two
  implementations were not actually identical. Report the failing case and its
  before/after values rather than tweaking the helpers to match.
- TypeScript cannot reconcile the `weekStartsOn` type between `calendar.ts:71` and
  the helper signatures.

## Maintenance notes

- After this lands there is a single source of truth for calendar grid math
  (`dateRanges.ts`). Any future DST or boundary change goes there once.
- Known, deliberately-unchanged behavior now centralized in `dateRanges.ts`:
  day boundaries are built with `plainTime '00:00:00'` / `'23:59:59.999'` and the
  default `'compatible'` disambiguation. On the rare zones that spring forward at
  midnight, `'compatible'` shifts a non-existent `00:00` forward rather than
  throwing — acceptable, but if exact-midnight semantics ever matter, address it in
  `dateRanges.ts` (one place) with its own tests.
- Reviewer should confirm the diff is a pure delegation (no arithmetic left in
  `calendar.ts`) and that test output is byte-identical before/after.
