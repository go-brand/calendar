# Implementation review audit

Audited on 2026-10-08 against commit `6d6decd` (`chore: upgrade to pnpm 11.12.0`).

No existing implementation review file was present in the checkout. This document audits the seven findings and two smaller edge cases from the preceding chat review. No library implementation was changed during that audit. The subsequently approved fixes are now implemented on `codex/calendar-reliability`; see [implementation status and evidence](plans/README.md#implementation-evidence). The observations below describe the audited baseline, not the repaired branch.

The observed behaviors reproduce. However, the original review overstated several findings as high-priority correctness bugs. A reproduction establishes behavior; the documented API contract and supported usage determine whether that behavior is a defect.

## Verdicts

| Original finding | Audited verdict | Priority |
| --- | --- | --- |
| React views do not subscribe to external controllers | Confirmed for controllers created with core `createCalendar`; ordinary `useCreateCalendar` plus provider navigation works | P2 |
| Navigation replaces the React controller | Replacement and stale retained actions are real, but a correctness defect is not established: normal React dependencies work and stable identity is not promised | Design/documentation concern |
| Timed events ignore the calendar timezone | Confirmed behavior, but automatic event conversion is not explicitly promised; clarify the accessor contract before changing behavior | Contract/documentation concern |
| Item-bearing React controller fails in core projections | Confirmed runtime/type-contract mismatch | P2 |
| Slot durations silently wrap | Confirmed for durations longer than 24 hours; ordinary durations work | P3 |
| CommonJS TypeScript declarations resolve incorrectly | Confirmed with TypeScript 5.9.3 and Node16 resolution; current NodeNext resolution and runtime `require` work | P2 |
| pnpm pin blocks normal repository commands | Confirmed locally and corroborated by npm registry deprecation metadata | P1 tooling blocker |

## 1. External core controllers do not cause React view updates

Source: `packages/react/src/index.ts:256`.

Create a core day controller at `2026-07-10`, pass it to `useCalendarView({ view: 'day', calendar })`, and call `calendar.next()` inside `act`. The controller advances to July 11, while the hook's returned projection remains July 10. Neither `useCalendarView` nor `useCalendar` subscribes to controller changes.

This applies to an externally owned core controller, which the public types accept. It does not mean ordinary React navigation is broken. A control test using `useCreateCalendar`, `CalendarProvider`, `useCalendar`, and `useCalendarView` updates both controls and the projection after two button clicks.

Either support external controllers reactively or explicitly constrain/document the React integration. The original P1 classification was too broad.

## 2. Controller replacement is real; the original test assumes stable identity

Source: `packages/react/src/index.ts:165`.

The hook creates a new controller when its resolved date or view changes. Retaining the first render's `next` function and invoking it across separate renders updates the displayed month only once. Subscribing to one instance does not subscribe to its replacement.

However, invoking the latest render's action continues to navigate correctly. This standard React subscription also receives both successive changes:

```tsx
useEffect(() => calendar.subscribe(listener), [calendar]);
```

No stable controller/action identity guarantee was found in the public documentation. React requires reactive dependencies to be kept current; retaining an old render's callback without updating dependencies is insufficient evidence of a library bug. See [React effect dependency guidance](https://react.dev/reference/react/useEffect#specifying-reactive-dependencies).

Treat stable controller identity as an API design choice or documentation improvement, not an established P1 defect. Controller recreation for geometry changes is explicitly documented in `apps/www/content/docs/(react)/controlled-state.mdx`.

## 3. Event timezone handling needs an explicit contract

Source: `packages/core/src/core/projections.ts:78`.

For a New York calendar on July 10, an event at `2026-07-10T12:00Z[UTC]` lands in the 12:00 slot if `getStart` returns that UTC value, even if `getDate` returns the New York date. Returning `value.withTimeZone('America/New_York')` from `getStart` places it at 08:00 as expected.

The implementation uses the accessor result's wall-clock time. The timezone documentation promises timezone-aware initial dates, today markers, and range boundaries, but does not explicitly promise automatic event conversion. The original report treated an assumed conversion policy as a proven defect.

Document that callers must normalize both accessors, or intentionally adopt automatic normalization. Changing only `getStart` handling inside the library would still leave day assignment controlled by `getDate`; both parts need a coherent contract. This is not yet a justified P1 correctness finding.

## 4. The React wrapper violates the core projection input contract

Sources: `packages/react/src/index.ts:212` and `packages/core/src/core/calendar.ts:82`.

Calling `useCreateCalendar` with items returns an `Object.create(calendar)` wrapper typed as a `CalendarController` with an additional `activeView`. Passing that value to the exported `buildDayView` throws `Unknown calendar controller`, because core's metadata WeakMap recognizes only the underlying instance.

The same wrapped value works with `useCalendarView`, which unwraps it. This control confirms that the issue is specifically interoperability with direct core projections. It is a real runtime/type-contract mismatch, not a general failure of the React hook.

## 5. Durations greater than a day can produce incorrect slot geometry

Source: `packages/core/src/core/projections.ts:72`.

With the default full-day range, tested slot counts were:

| Duration | Slots |
| --- | ---: |
| 1 hour | 24 |
| 2 hours | 12 |
| 24 hours | 1 |
| 25 hours | 24 |

`PlainTime.add` discards whole-day overflow. The wrap comparison therefore cannot distinguish 25 hours from one hour. A 25-hour duration is accepted without warning, producing misleading geometry. The library should reject unsupported durations or handle them explicitly.

This is a real input-boundary defect, but the previous priority overstated its practical impact for conventional intraday slots.

## 6. Declaration exports fail for Node16 CommonJS consumers

Sources: `packages/core/package.json:15` and `packages/react/package.json:15`.

Both packages generate `.d.cts` files but point their unconditional `types` export at the ESM `.d.ts` file. A `.cts` consumer importing either package fails with TS1479 under TypeScript 5.9.3:

```sh
tsc --noEmit --module Node16 --moduleResolution Node16 --target ES2022 --skipLibCheck consumer.cts
```

The same consumer passes under `--module NodeNext --moduleResolution NodeNext` with that compiler. Runtime `require` resolves both packages successfully on the tested Node v26.5.0 runtime. The finding is therefore a declaration compatibility failure for affected TypeScript resolution modes, not a blanket CommonJS runtime failure.

Conditional declaration exports should match the import and require entrypoints. See [TypeScript's declaration and package export guidance](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#packagejson-exports-imports-and-self-referencing).

## 7. The package-manager pin is verifiably broken

Sources: `package.json:26` and `.github/workflows/ci.yml:25`.

The local pnpm launcher refuses the pinned 11.12.0 release. Independent registry queries for both `pnpm@11.12.0` and `@pnpm/exe@11.12.0` return this deprecation message:

> This release is broken. Please upgrade to v11.13.1 or newer.

Verification commands:

```sh
npm view pnpm@11.12.0 version deprecated engines --json
npm view @pnpm/exe@11.12.0 version deprecated bin --json
```

The registry also declares Node `>=22.13` for this pnpm version, while CI includes a Node 20 job. A replacement pin must be selected together with a compatible CI Node matrix. Remote CI was not executed during this audit.

## Smaller reproduced edge cases

- Reordering an otherwise unchanged `views` object leaves `viewNames` in its initial order because `viewSignature` uses a fixed name order. Normal view selection still works. No explicit promise of live insertion-order synchronization was found, so this is a minor API consistency issue.
- An event at exactly `23:59:59.999999999` remains in `day.items` but appears in no default time slot. The preceding nanosecond is included. The default endpoint is the last representable time, but comparison treats it as exclusive. This is a real, very low-impact boundary defect.

## Verification scope

Nine fresh behavior probes passed, asserting both the reported behavior and relevant working control cases. Separate compilation checks confirmed the Node16 failure and NodeNext success. Runtime CommonJS loading and live npm metadata were also checked. Temporary probe files were removed after execution.

The prior review's 161-test baseline was not rerun: implementation files had not changed. Its test-coverage observation is supported by inspection: `packages/core/src/invariants.test.ts` exercises legacy builders and shared date-range helpers rather than the exported view projections. That is a coverage gap, not evidence that the exported projections necessarily violate every tested invariant.
