# Plan 002: Bump TanStack Store to 0.11 and fix React reactivity

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat b081220..HEAD -- packages/react/src/index.ts packages/react/package.json packages/core/package.json packages/core/src/core/calendar.ts`
> If any of those changed since this plan was written, compare the "Current
> state" excerpts against the live code; on a mismatch, treat it as a STOP
> condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-test-and-typecheck-baseline.md
- **Category**: bug (React reactivity) + migration (dependency bump)
- **Planned at**: commit `b081220`, 2026-06-28

## Why this matters

`@gobrand/react-calendar` builds calendar state on a `@tanstack/store` `Store`,
which is a **reactive** store — but the React hooks never subscribe to it.
`useView` calls `calendar.getState()` directly, and `useCalendar` just returns the
calendar instance. The store's `subscribe()` is never wired into React, and the
reactive binding package `@tanstack/react-store` is not even a dependency.

In practice the demo works only by accident: when the component that called
`useCreateCalendar` re-renders (it keeps a mirrored copy of state in `useState`),
its inline children re-render too. The moment a consumer is decoupled from that
cascade — wrapped in `React.memo`, or rendered from a `CalendarProvider` whose
parent does not re-render — navigation (`next()`, `setCurrentView()`,
`goToDate()`) updates the store but the consuming component shows **stale** data.
For a library whose headline React feature is `CalendarProvider` + `useView` /
`useCalendar` in separate components, that is a real correctness bug.

The fix is to subscribe these hooks to the store using the official React binding.
We bump `@tanstack/store` 0.8 → 0.11 and add `@tanstack/react-store` 0.11 in the
same plan because the binding is the whole point of the bump.

### Verified facts about TanStack Store 0.11 (do not re-investigate)

- `@tanstack/store@0.11.0` keeps the API this codebase uses: `new Store(initialValue)`,
  `store.state`, `store.setState((prev) => next)`, `store.subscribe(...)`. The
  current `calendar.ts` usage (`new Store<CalendarState>({...})` and
  `store.setState(() => fullState)`) is **non-breaking** on the bump.
- `@tanstack/react-store@0.11.0` exports `useSelector(source, selector?, options?)`
  as the primary React read hook. It also exports `useStore`, **but `useStore` is
  deprecated in 0.11 as an alias for `useSelector`** — use `useSelector`.
- `Store` structurally satisfies `useSelector`'s source type (it has `get()`,
  `state`, and `subscribe()` returning `{ unsubscribe }`), so
  `useSelector(calendar.store, (s) => s.referenceDate)` type-checks directly.

## Current state

- `packages/core/package.json:40-43` — core depends on store 0.8:
  ```json
  "dependencies": {
    "@js-temporal/polyfill": "^0.5.1",
    "@tanstack/store": "^0.8.0"
  },
  ```
- `packages/react/package.json:40-43` — react has **no** `@tanstack/react-store`:
  ```json
  "dependencies": {
    "@js-temporal/polyfill": "^0.5.1",
    "@gobrand/calendar-core": "workspace:^"
  },
  ```
- `packages/core/src/core/calendar.ts:94-99` — the store is created here and
  exposed as `calendar.store`:
  ```ts
  const store = new Store<CalendarState>({
    referenceDate: initialReferenceDate,
    currentView: initialView,
    dateRange: initialDateRange,
    ...resolvedOptions.state,
  });
  ```
  State updates flow through `setStateImpl` (`calendar.ts:140-166`), which calls
  `store.setState(...)` then `_options.onStateChange(...)`.
- `packages/react/src/index.ts` — the two hooks to fix:
  - `useView` (lines 159-196) reads state non-reactively:
    ```ts
    const state = calendar.getState();
    const effectiveView = name ?? state.currentView;
    return useMemo(() => {
      switch (effectiveView) {
        case 'month': return { type: 'month' as const, data: calendar.getMonth(data) };
        case 'week':  return { type: 'week' as const,  data: calendar.getWeek(data) };
        case 'day':   return { type: 'day' as const,   data: calendar.getDay(data) };
        default: throw new Error(`Unknown view: ${effectiveView}`);
      }
    }, [calendar, data, state.referenceDate.toString(), effectiveView]) as ViewResultFor<TItem, V>;
    ```
  - `useCalendar` (lines 113-124) returns the instance with no subscription:
    ```ts
    export function useCalendar<TItem = unknown>(): CalendarInstance<TItem> {
      const calendar = useContext(CalendarContext);
      if (!calendar) { throw new Error(/* ... */); }
      return calendar as CalendarInstance<TItem>;
    }
    ```
- `packages/react/src/index.ts:63` — the context type:
  `createContext<CalendarInstance<unknown> | null>(null)`. The `.store` field is
  on `CalendarInstance` (`packages/core/src/types.ts:280`) as
  `Store<CalendarState>`.

Repo conventions:
- React hooks file is a single `packages/react/src/index.ts`, `'use client'` at top.
- Tests live in `packages/react/src/index.test.tsx`, using `vitest` +
  `@testing-library/react` (`render`, `screen`, `renderHook`, `act`). jsdom env,
  globals enabled (`packages/react/vitest.config.ts`). Model new tests on the
  existing `describe`/`it` structure there.
- The `accessor` test fixture and `Event` type already exist at the top of
  `index.test.tsx:8-19` — reuse them.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install (after dep edits) | `pnpm install` | exit 0, lockfile updated |
| React tests only | `pnpm --filter @gobrand/react-calendar run test --run` | all pass |
| All tests | `pnpm test --run` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Build | `pnpm build` | exit 0 |

> CLAUDE.md rule: after changing `package.json` dependencies you MUST run
> `pnpm install` so `pnpm-lock.yaml` updates — CI uses `--frozen-lockfile` and
> fails if the lockfile is stale.

## Suggested executor toolkit

- If available, invoke the `vercel-react-best-practices` skill when writing the
  subscription in Step 4 (selector hooks, avoiding extra re-renders).

## Scope

**In scope**:
- `packages/core/package.json` — bump `@tanstack/store` to `^0.11.0`.
- `packages/react/package.json` — add `@tanstack/react-store` `^0.11.0`.
- `packages/react/src/index.ts` — subscribe `useView` and `useCalendar` to the store.
- `packages/react/src/index.test.tsx` — add the failing-then-passing reactivity tests.
- `pnpm-lock.yaml` — updated by `pnpm install` (do not hand-edit).

**Out of scope** (do NOT touch):
- `packages/core/src/core/calendar.ts` — the core store/`setStateImpl` logic is
  correct and 0.11-compatible; do not refactor it here.
- `useCreateCalendar` (`packages/react/src/index.ts:29-57`) — it keeps a mirrored
  `useState` copy that becomes partly redundant once consumers subscribe, but
  leave it as-is; simplifying it is a separate, riskier change (see Maintenance).
- Any view-builder logic in `packages/core/src/utils/`.

## Git workflow

- Branch: `advisor/002-react-reactivity`
- Conventional commits. Suggested commits:
  1. `chore(deps): bump @tanstack/store to 0.11 and add @tanstack/react-store`
  2. `test(react): add failing reactivity tests for useView/useCalendar`
  3. `fix(react): subscribe useView and useCalendar to the calendar store`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Bump dependencies and confirm no regression

In `packages/core/package.json`, change `"@tanstack/store": "^0.8.0"` →
`"@tanstack/store": "^0.11.0"`.

In `packages/react/package.json`, add to `dependencies`:
`"@tanstack/react-store": "^0.11.0"`.

Then:

**Verify**:
- `pnpm install` → exit 0; `pnpm-lock.yaml` now references `@tanstack/store@0.11`
  and `@tanstack/react-store@0.11` (`grep -n "@tanstack/store@0.11\|@tanstack/react-store@0.11" pnpm-lock.yaml` returns matches).
- `pnpm test --run` → exit 0 (existing 230 tests still pass — this proves the bump
  itself did not break anything).
- `pnpm typecheck` → exit 0.

If the bump alone breaks existing tests or typecheck, STOP and report — the 0.11
API was verified compatible, so a failure here means something unexpected.

### Step 2: Write the failing reactivity test for `useView` (red)

Add a new `describe('reactivity', ...)` block to `packages/react/src/index.test.tsx`.
The test must isolate the consumer from the `useCreateCalendar` re-render cascade
by using the core `createCalendar` directly with a `CalendarProvider`, so the only
thing that can update the consumer is a store subscription.

Target test shape:

```tsx
describe('reactivity', () => {
  it('useView re-renders when calendar state changes (via context)', () => {
    const referenceDate = Temporal.PlainDate.from('2025-01-15');
    const calendar = createCalendar<Event>({
      views: { month: { accessor } },
      state: { referenceDate },
    });

    function MonthTitle() {
      const view = useView<Event, 'month'>({ data: [], name: 'month' });
      return <span data-testid="title">{view.data.month.toString()}</span>;
    }

    render(
      <CalendarProvider calendar={calendar}>
        <MonthTitle />
      </CalendarProvider>
    );

    expect(screen.getByTestId('title').textContent).toBe('2025-01');

    act(() => {
      calendar.nextMonth();
    });

    // FAILS before the fix: consumer never re-renders, still shows 2025-01.
    expect(screen.getByTestId('title').textContent).toBe('2025-02');
  });

  it('useCalendar re-renders consumer on navigation (via context)', () => {
    const referenceDate = Temporal.PlainDate.from('2025-01-15');
    const calendar = createCalendar<Event>({
      views: { month: { accessor } },
      state: { referenceDate },
    });

    function Toolbar() {
      const cal = useCalendar<Event>();
      return <span data-testid="cal-title">{cal.getTitle('month')}</span>;
    }

    render(
      <CalendarProvider calendar={calendar}>
        <Toolbar />
      </CalendarProvider>
    );

    const before = screen.getByTestId('cal-title').textContent;
    act(() => {
      calendar.nextMonth();
    });
    const after = screen.getByTestId('cal-title').textContent;

    // FAILS before the fix: title does not change.
    expect(after).not.toBe(before);
  });
});
```

Notes for the executor:
- `createCalendar`, `CalendarProvider`, `useView`, `useCalendar`, `accessor`, and
  `Event` are all already imported / defined at the top of the test file
  (`index.test.tsx:5-19`). Add nothing to imports except what you actually use.
- `view.data.month` is a `Temporal.PlainYearMonth`; `.toString()` yields `"2025-01"`.

**Verify**: `pnpm --filter @gobrand/react-calendar run test --run` → the two new
tests **FAIL** (red), every other test still passes. If the new tests pass before
the fix, STOP — the bug may not reproduce as expected and the test is not proving
anything; report so the test can be corrected.

### Step 3: Import the binding hook

At the top of `packages/react/src/index.ts`, add:

```ts
import { useSelector } from '@tanstack/react-store';
```

Do not import `useStore` (deprecated in 0.11).

### Step 4: Subscribe `useView` to the store

In `useView` (`packages/react/src/index.ts:159-196`), replace the non-reactive
`const state = calendar.getState();` read with reactive selectors from the store,
and use them as the memo dependencies:

```ts
// inside useView, after `calendar` is resolved and the null check:
const referenceDate = useSelector(calendar.store, (s) => s.referenceDate);
const currentView = useSelector(calendar.store, (s) => s.currentView);

const effectiveView = name ?? currentView;

return useMemo(() => {
  switch (effectiveView) {
    case 'month': return { type: 'month' as const, data: calendar.getMonth(data) };
    case 'week':  return { type: 'week' as const,  data: calendar.getWeek(data) };
    case 'day':   return { type: 'day' as const,   data: calendar.getDay(data) };
    default: throw new Error(`Unknown view: ${effectiveView}`);
  }
}, [calendar, data, referenceDate.toString(), effectiveView]) as ViewResultFor<TItem, V>;
```

Key points:
- `useSelector` must be called unconditionally (React hook rules). It is fine that
  it runs after the `if (!calendar) throw` guard, because that guard throws (it
  does not return) — so on the path where hooks run, `calendar` is non-null.
- The `useMemo` dependency changes from `state.referenceDate.toString()` to
  `referenceDate.toString()` (now the subscribed value) — keep the `.toString()`
  so the dep is a stable primitive, matching the existing pattern.

### Step 5: Subscribe `useCalendar` to the store

In `useCalendar` (`packages/react/src/index.ts:113-124`), add a whole-state
subscription so any component using the instance re-renders on state change, then
return the instance as before:

```ts
export function useCalendar<TItem = unknown>(): CalendarInstance<TItem> {
  const calendar = useContext(CalendarContext);
  if (!calendar) {
    throw new Error(
      'useCalendar must be used within a CalendarProvider. ' +
      'Wrap your component tree with <CalendarProvider calendar={calendar}>.'
    );
  }
  // Subscribe so consumers re-render when calendar state changes.
  useSelector(calendar.store);
  return calendar as CalendarInstance<TItem>;
}
```

`useSelector(calendar.store)` with no selector subscribes to the whole state — any
`setState` triggers a re-render of the consuming component, which is what we want
for a hook that hands back an imperative instance.

### Step 6: Confirm green and no regressions

**Verify**:
- `pnpm --filter @gobrand/react-calendar run test --run` → all pass, including the
  two new reactivity tests (now green).
- `pnpm test --run` → exit 0.
- `pnpm typecheck` → exit 0.
- `pnpm build` → exit 0.

## Test plan

- New tests in `packages/react/src/index.test.tsx`, `describe('reactivity', ...)`:
  - `useView` re-renders a context consumer when `calendar.nextMonth()` runs
    (the core bug: title goes `2025-01` → `2025-02`).
  - `useCalendar` re-renders a context consumer on navigation.
- Both are written to FAIL against the current code and PASS after Steps 3-5.
- Structural pattern: the existing `render` / `screen` / `act` tests already in
  `index.test.tsx` (e.g. the "renders month view with data" block).
- Verification: `pnpm --filter @gobrand/react-calendar run test --run` → all pass,
  including the 2 new tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "@tanstack/store" packages/core/package.json` shows `^0.11`
- [ ] `grep -n "@tanstack/react-store" packages/react/package.json` shows `^0.11`
- [ ] `grep -n "useSelector" packages/react/src/index.ts` shows it imported and
      used in both `useView` and `useCalendar`
- [ ] `grep -n "useStore" packages/react/src/index.ts` returns no matches
      (deprecated alias not used)
- [ ] `pnpm install` has been run and `pnpm-lock.yaml` is updated
- [ ] `pnpm test --run` exits 0; the two new reactivity tests exist and pass
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm build` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 002 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The dependency bump (Step 1) breaks existing tests or typecheck — the 0.11 API
  was verified compatible, so report the exact error.
- The new reactivity tests in Step 2 **pass before** the fix — they are not
  reproducing the bug; report so the test design can be corrected.
- `useSelector(calendar.store, ...)` fails to type-check (e.g. "Store is not
  assignable to source") — report the error; do not cast it away with `as any`.
- After the fix, any existing test regresses (e.g. a double-render assertion) —
  report which test and its output.
- Plan 001 has not been completed (i.e. `pnpm test --run` is red for reasons
  unrelated to your changes) — stop and complete 001 first.

## Maintenance notes

- `useCreateCalendar` still mirrors state into a local `useState` and wires
  `onStateChange`. With consumers now subscribing to the store directly, that
  mirror is largely redundant and a future cleanup could remove it so the store is
  the single source of truth. Deliberately left out of this plan to keep the change
  small and the diff reviewable; do it as its own plan with its own tests.
- Reviewer should scrutinize: hooks are called unconditionally (no hook below a
  conditional return), and `useSelector` selectors return primitives / stable
  references so they do not cause extra re-renders.
- If a new view type is added, `useView`'s switch and the `currentView` selector
  continue to work unchanged.
