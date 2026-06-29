# Plan 003: Fix `getTimezoneOffset` for fractional and negative offsets

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat b081220..HEAD -- packages/core/src/utils.ts packages/core/src/utils.test.ts`
> If either changed since this plan was written, compare the "Current state"
> excerpts against the live code; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-test-and-typecheck-baseline.md
- **Category**: bug
- **Planned at**: commit `b081220`, 2026-06-28

## Why this matters

`getTimezoneOffset` is part of the public exported API
(`packages/core/src/index.ts` re-exports all of `utils.ts`). It returns the wrong
string for any timezone whose offset is not a whole number of hours, and for
negative offsets it rounds the wrong direction:

- India (`Asia/Kolkata`, +05:30) → returns `"+5"` (loses the 30 minutes).
- Newfoundland (`America/St_Johns`, -03:30) → returns `"-4"`: the code does
  `Math.floor(-3.5) === -4`, so it reports a *larger* negative offset than reality.

Roughly a dozen IANA zones use half-hour or 45-minute offsets (India, Iran,
Afghanistan, Newfoundland, parts of Australia, Nepal, etc.). A user formatting
offsets for any of them gets a silently wrong value. The existing tests only cover
whole-hour zones (Paris +1, New York -5, UTC), which is exactly why the bug was
never caught.

## Current state

`packages/core/src/utils.ts:84-88`:

```ts
export function getTimezoneOffset(dateTime: Temporal.ZonedDateTime): string {
  return dateTime.offsetNanoseconds / 3600000000000 >= 0
    ? `+${Math.floor(dateTime.offsetNanoseconds / 3600000000000)}`
    : `${Math.floor(dateTime.offsetNanoseconds / 3600000000000)}`;
}
```

`3600000000000` is nanoseconds per hour. Dividing gives a fractional hour count
(e.g. `5.5` for India); `Math.floor` truncates it and drops the minutes, and for
negatives `Math.floor` rounds away from zero.

Existing tests (`packages/core/src/utils.test.ts:251-266`) that MUST keep passing:

```ts
// Europe/Paris  → '+1'
// America/New_York → '-5'
// UTC → '+0'
```

Repo conventions:
- Tests are in `packages/core/src/utils.test.ts`, `vitest` with `describe`/`it`,
  imported from `./utils` (see the import block at `utils.test.ts:1-24`).
- This library uses only the Temporal API — no `Date`. `dateTime.offsetNanoseconds`
  is the canonical source for the offset.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Core tests only | `pnpm --filter @gobrand/calendar-core run test --run` | all pass |
| Target this file | `pnpm --filter @gobrand/calendar-core run test getTimezoneOffset --run` | matched tests pass |
| All tests | `pnpm test --run` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:
- `packages/core/src/utils.ts` — fix `getTimezoneOffset` only.
- `packages/core/src/utils.test.ts` — add fractional/negative cases.

**Out of scope** (do NOT touch):
- Any other function in `utils.ts` (e.g. `convertToTimezone`, `createZonedDateTime`).
- The output format for whole-hour zones — it must stay `"+1"` / `"-5"` / `"+0"`,
  not switch to ISO `"+01:00"`; downstream callers and existing tests depend on it.

## Git workflow

- Branch: `advisor/003-timezone-offset`
- Conventional commits:
  1. `test(core): add failing fractional/negative cases for getTimezoneOffset`
  2. `fix(core): handle fractional and negative timezone offsets`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Write the failing tests (red)

Add these cases to the existing `describe('getTimezoneOffset', ...)` block in
`packages/core/src/utils.test.ts` (right after the UTC case at line ~265):

```ts
it('should include minutes for half-hour offsets ahead of UTC', () => {
  const dateTime = Temporal.ZonedDateTime.from('2024-01-01T12:00:00[Asia/Kolkata]');
  const result = getTimezoneOffset(dateTime);
  expect(result).toBe('+5:30');
});

it('should include minutes for half-hour offsets behind UTC', () => {
  const dateTime = Temporal.ZonedDateTime.from('2024-01-01T12:00:00[America/St_Johns]');
  const result = getTimezoneOffset(dateTime);
  expect(result).toBe('-3:30');
});

it('should still format whole-hour offsets without minutes', () => {
  const ahead = Temporal.ZonedDateTime.from('2024-01-01T12:00:00[Europe/Paris]');
  const behind = Temporal.ZonedDateTime.from('2024-01-01T12:00:00[America/New_York]');
  expect(getTimezoneOffset(ahead)).toBe('+1');
  expect(getTimezoneOffset(behind)).toBe('-5');
});
```

> Note: `America/St_Johns` is -03:30 in January (standard time). If your Node /
> polyfill data ever disagrees, that is a STOP condition — report it.

**Verify**: `pnpm --filter @gobrand/calendar-core run test getTimezoneOffset --run`
→ the two half-hour tests **FAIL** (red): current code returns `"+5"` and `"-4"`.
The whole-hour test passes. If the half-hour tests pass before the fix, STOP and
report.

### Step 2: Rewrite `getTimezoneOffset` (green)

Replace the function body at `packages/core/src/utils.ts:84-88` with:

```ts
export function getTimezoneOffset(dateTime: Temporal.ZonedDateTime): string {
  const totalMinutes = Math.trunc(dateTime.offsetNanoseconds / 60_000_000_000);
  const sign = totalMinutes < 0 ? '-' : '+';
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return minutes === 0
    ? `${sign}${hours}`
    : `${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}
```

Why this is correct:
- `60_000_000_000` is nanoseconds per minute; `Math.trunc` toward zero gives signed
  total minutes (e.g. India `330`, Newfoundland `-210`, UTC `0`).
- Sign is taken from the total, then magnitude is split into whole hours and
  remaining minutes — so negatives no longer round away from zero.
- Whole-hour offsets (`minutes === 0`) keep the existing compact format
  (`"+1"`, `"-5"`, `"+0"`).

**Verify**: `pnpm --filter @gobrand/calendar-core run test getTimezoneOffset --run`
→ all `getTimezoneOffset` tests pass (green).

### Step 3: Full regression check

**Verify**:
- `pnpm test --run` → exit 0 (no other test regressed).
- `pnpm typecheck` → exit 0.

## Test plan

- New tests in `packages/core/src/utils.test.ts`, in the existing
  `describe('getTimezoneOffset', ...)` block:
  - half-hour ahead (`Asia/Kolkata` → `"+5:30"`),
  - half-hour behind (`America/St_Johns` → `"-3:30"`),
  - whole-hour regression guard (`"+1"`, `"-5"`).
- Written to FAIL before Step 2 and PASS after.
- Structural pattern: the existing cases in the same `describe` block.
- Verification: `pnpm --filter @gobrand/calendar-core run test --run` → all pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm test --run` exits 0; new fractional/negative `getTimezoneOffset` tests
      exist and pass
- [ ] `pnpm typecheck` exits 0
- [ ] `grep -n "3600000000000" packages/core/src/utils.ts` returns no matches
      (old per-hour constant removed)
- [ ] Only `packages/core/src/utils.ts` and `packages/core/src/utils.test.ts` are
      modified (`git status`)
- [ ] `plans/README.md` status row for 003 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The half-hour tests pass against the current (unfixed) code — the bug is not
  reproducing as expected.
- The installed Temporal polyfill reports a different offset for `Asia/Kolkata` or
  `America/St_Johns` than `+05:30` / `-03:30` in January 2024 — report it rather
  than adjusting the expected strings blindly.
- Any existing whole-hour test regresses after the fix.

## Maintenance notes

- If a future caller wants the ISO format (`"+05:30"`), prefer Temporal's own
  `dateTime.offset` rather than re-deriving it — but that is a different format and
  a separate decision; do not change this function's contract silently.
- 45-minute zones (e.g. `Asia/Kathmandu`, +05:45) are now handled correctly by the
  same code path; a test for one could be added later but is not required here.
