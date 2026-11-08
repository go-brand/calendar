# Plan 008: Repair React composition without replacing its state model

- Status DONE; priority P2; effort M; risk medium; category correctness.
- Planned at `6d6decd`, 2026-10-08. Depends on plan 006. Plan 007 may land independently; synchronize final public wording.
- Suggested branch `codex/react-composition`; conventional commits. No publishing or broad refactor.
- Drift check: `git diff --stat 6d6decd..HEAD -- packages/core/src/core/calendar.ts packages/core/src/core/projections.ts packages/react/src/index.ts packages/react/src/v1.test.tsx packages/core/src/core/projections.test.ts`. Compare current behavior with the excerpts below; account for completed predecessor plans.

## Intended improvement

A controller already accepted by the public types should compose across core projections and React consumers. Preserve the one-hook simple mode, item-agnostic context, inferred item/view types, per-render controller replacement, and controls above Suspense. No public unwrap, registration, context factory, stable-action guarantee, or additional store dependency.

Allowed files: `packages/core/src/core/calendar.ts`, `packages/react/src/index.ts`, existing core/React test files or new focused tests under those packages, and the affected React/core API documentation. `packages/core/src/types.ts` and `packages/core/src/index.ts` may be inspected but public signatures/exports must remain unchanged. Do not change event mapping, durations, timezone policy, calendar math, or package dependencies.

## Current state

Core metadata lookup (`calendar.ts:81`) is:

```ts
const metadata = controllerMetadata.get(calendar);
if (!metadata) throw new Error('Unknown calendar controller');
```

React simple mode uses `Object.create(calendar)` and defines `activeView` on the new wrapper (`index.ts:212`). React stores an alias for its own helpers, but direct core builders receive the wrapper and fail. This is a reproduced type/runtime mismatch for the controller intersection returned by the hook.

`useCalendar` and `useCalendarView` read context/props but do not subscribe (`index.ts:233,256`). External core controllers change without rerendering their consumers. Hook-owned calendars normally work because `useCreateCalendar` synchronizes source state through a layout subscription and recreates the controller using `useMemo`. Controlled navigation mutates a proposed core value, invokes the callback, then schedules reset/replacement (`index.ts:183–201`). Subscribing every consumer to that transient mutation is not an acceptable shortcut.

Existing `v1.test.tsx` provides Testing Library/Vitest patterns. Its Suspense test only renders permanently pending content and checks controls initially exist; it does not prove navigation/transition or rejected-controlled-state behavior.

## Steps

1. Build the unchanged core with `pnpm --filter @gobrand/calendar-core build` before the baseline React run so a fresh checkout has the package `dist` entrypoint. Then add failing tests for direct `buildMonthView`, `buildWeekView`, and `buildDayView` using the item-bearing hook result. Include a control using the existing React view hook/provider. Keep items and all configured view types inferred; do not hide failures with `as never` in consumer tests.
   - Verify `pnpm --filter @gobrand/react-calendar test v1 --run` fails specifically with `Unknown calendar controller` in the new direct-builder tests before the repair.
2. Make core metadata lookup support the one-layer wrapper by checking the original WeakMap key and, if absent, its immediate prototype. Keep metadata private. This also accepts any immediate descendant of a registered controller; it does not authenticate the React wrapper's origin. That narrow behavior is acceptable here and needs no new provenance machinery. Add a comment explaining the bounded relation. Do not recursively walk arbitrary prototypes, expose metadata, add a public unwrap function, or mutate `activeView` on a reused controller.
   - Run `pnpm --filter @gobrand/calendar-core build` before React tests: React imports the package entrypoint in `dist`, not core source. Verify all new builder tests pass, item updates produce the correct new projection, and existing React/provider paths still pass.
3. Add a characterization block BEFORE adding external-store subscriptions. Cover normal repeated navigation; controlled date/view immediately reflecting props; rejected callbacks retaining the controlled value; delayed acceptance; changing timezone/geometry; controller replacement; StrictMode cleanup; controls above suspended content; and navigation under `startTransition` after content was already revealed. Include `renderToString` followed by `hydrateRoot` with matching explicit date/view/timezone inputs, then navigation; a server-render-only smoke does not verify hydration snapshots. Keep these checks appropriate to React 18/19.
   - Run the focused React suite and record the current passing controls. Do not demand stable identity or prevent a normal loading fallback after ordinary urgent navigation. Test that the proposed subscription change preserves the baseline behavior rather than inventing new transition guarantees.
4. Add failing external-controller tests for `useCalendar` through provider input, and `useCalendarView` through both explicit `calendar` and provider input. `useCalendar` has no direct-controller argument. Date navigation (`setDate`, `next`, `previous`) must update displayed dates and projections; `setView` must update control state while preserving the literal projection type explicitly requested by `useCalendarView({ view: ... })`. Do not make the projection follow the active controller view implicitly. Replacing the supplied instance must unsubscribe from the old one. Include switching between external and hook-owned instances without changing hook order.
5. Implement the smallest ownership-aware subscription boundary:
   - Record raw controllers created by `useCreateCalendar` in a React-local private `WeakSet` as each new instance is constructed. Do not mutate a previously committed controller or add public provenance APIs.
   - Unwrap the existing item-bearing alias before determining ownership.
   - Both consumer hooks call the same internal subscription hook unconditionally. A missing controller must still preserve hook order and produce the current descriptive error.
   - For hook-owned controllers, use stable no-op subscribe and CONSTANT snapshot/server-snapshot functions. Reading mutable state in a supposedly disabled snapshot is not safe enough.
   - For external controllers, use `useSyncExternalStore` with a stable primitive snapshot reflecting date and view, a subscription bound to that instance, and consistent server snapshot behavior. Do not return a fresh range/object each read. Instance changes already carry geometry/timezone changes through props/context.
   - Preserve React-owned state updates, callbacks, and memo dependencies. External mutable stores retain React's documented blocking-update limitations; do not promise identical transition behavior for them.
   - If this boundary grows into a new controller facade, multiple synchronization layers, or a public ownership flag, stop and re-evaluate. The wrapper fix can ship separately.
6. Run every characterization and regression test. Inspect rendered/query effects to ensure rejected controlled proposals do not gain new observations because of the subscription change. Update only the affected API docs with the now-verified external-controller support and controller lifetime contract.

## Verification commands

Run `pnpm --filter @gobrand/calendar-core build` whenever core implementation changes, then `pnpm --filter @gobrand/react-calendar test v1 --run` (or the exact new test filename if separated). Final gates: `pnpm test --run`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm verify:packages`, and `pnpm test:docs`; all exit 0. Run documentation generation only if source docs changed and inspect the generated diff.

The external-store pattern is governed by [React's snapshot and transition caveats](https://react.dev/reference/react/useSyncExternalStore#caveats). Use those rules to avoid snapshot loops and changed Suspense semantics, not as justification to replace the existing state model.

## Done criteria

- All three direct core builders accept the item-bearing React result without a new public API.
- External controllers update both controls and projections; old subscriptions clean up after replacement/unmount.
- Hook-owned controlled, uncontrolled, StrictMode, SSR, and tested Suspense/transition behavior remains correct.
- No new stable controller/action identity promise or automatic event conversion is introduced.
- All package/type/consumer checks pass; tests prove the original failures and working controls.

Stop if controlled proposals become observably committed, if current transition behavior changes, if server snapshots are inconsistent, or if tests require weakening a public type. Keep the proven wrapper repair and defer external subscription implementation if preserving semantics cannot be demonstrated. Do not label the entire plan complete in that case; record precisely the partial outcome.

Maintenance: retain the ownership tests whenever controller construction changes. The metadata fallback checks only the controller and its immediate prototype; deeper wrapper chains remain unsupported. New controller metadata should not be added without a demonstrated state/geometry requirement.
