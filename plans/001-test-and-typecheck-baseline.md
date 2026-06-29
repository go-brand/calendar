# Plan 001: Establish a green workspace test & typecheck baseline

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat b081220..HEAD -- package.json apps/demo/package.json packages/core/tsconfig.json packages/react`
> If any of those files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx / tests
- **Planned at**: commit `b081220`, 2026-06-28

## Why this matters

`pnpm test --run` is the command CLAUDE.md documents and CI runs, but it
currently **fails**. The failure is not in the library — both published packages
pass (230 tests) — it is `apps/demo`, which declares a `test` script (`vitest run`)
but has zero test files and no vitest config. Vitest falls back to the app's
`vite.config.ts`, which loads the Cloudflare and TanStack-Start plugins, and
crashes with `ReferenceError: module is not defined` (the `tiny-warning` CJS
module evaluated in a vitest worker). Because the root `test` script runs
`pnpm -r run test` across every workspace package, this one broken app turns the
whole suite red. Until this is fixed, no other plan can trust a red/green signal.

Separately, test files are excluded from type-checking (`packages/core/tsconfig.json`
and the documented item in `TODO.md`). That is why a type-level regression in the
public generic API can ship uncaught. Re-enabling test typechecking is part of a
trustworthy testing setup and belongs in this baseline plan.

## Current state

Files involved:

- `package.json` (repo root) — defines the workspace-wide scripts.
  ```json
  // package.json:9-15
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "typecheck": "pnpm -r run typecheck",
    "release": "bash scripts/release.sh",
    "generate:docs": "tsx scripts/generate-docs.ts"
  },
  ```
- `pnpm-workspace.yaml` — includes apps in the workspace:
  ```yaml
  packages:
    - 'packages/*'
    - 'apps/*'
  ```
- `apps/demo/package.json` — has `"test": "vitest run"` but `apps/demo/src` contains
  no `*.test.*` files and there is no `apps/demo/vitest.config.*`. Running it
  produces:
  ```
  apps/demo test: ReferenceError: module is not defined
      at .../tiny-warning/dist/tiny-warning.cjs.js:22:1
  ```
- `packages/core/tsconfig.json` — excludes test files from typecheck:
  ```jsonc
  // packages/core/tsconfig.json:16
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
  ```
- `packages/react/tsconfig.json` — read it; it likely excludes test files the same
  way. Apply the same treatment as core if it does.

Repo conventions:
- Package manager is **pnpm** (v10), workspace via `pnpm-workspace.yaml`.
- `apps/www` has no `test` script (only `packages/core`, `packages/react`, and the
  broken `apps/demo` do). Confirm with: `pnpm -r exec node -e "0" 2>/dev/null; grep -l '"test"' packages/*/package.json apps/*/package.json`.
- Vitest is the test runner; tests live next to source as `*.test.ts(x)`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `pnpm install` | exit 0 |
| Run all package tests | `pnpm test --run` | exit 0, all suites pass |
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Build (regression check) | `pnpm build` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `package.json` (root) — narrow the `test` script to packages.
- `packages/core/tsconfig.json` — stop excluding test files from typecheck.
- `packages/react/tsconfig.json` — same, only if it currently excludes tests.
- `TODO.md` — remove the now-resolved "Fix Test Type Checking" item (optional, but
  do it so the TODO stays honest).

**Out of scope** (do NOT touch):
- `apps/demo/**` and `apps/www/**` — do not try to add a vitest setup to the demo
  app or "fix" its vite config; the app simply has no unit tests and should not be
  part of the library test run.
- Any test file contents, any `src/**` source — this plan only changes config.
- The CI workflow `.github/workflows/ci.yml` — the narrowed root script fixes CI
  automatically; do not edit the workflow.

## Git workflow

- Branch: `advisor/001-test-baseline`
- Commit style: conventional commits (repo history uses `chore:`, `fix:`, `docs:` —
  e.g. `8673356 fix: allow single type argument...`). Use
  `chore: scope workspace test script to packages and typecheck test files`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Reproduce the failure (confirm red)

Run the current broken command so you can see the baseline before changing it.

**Verify**: `pnpm test --run` → exits non-zero; output contains
`apps/demo test: ReferenceError: module is not defined`. (If it already passes,
this is a STOP condition — the repo has drifted.)

### Step 2: Narrow the root `test` script to packages

In `package.json` (root), change the `test` script so it only runs the workspace
packages, not the apps:

```json
"test": "pnpm --filter \"./packages/*\" run test",
```

Leave `build` and `typecheck` as they are (apps are intentionally built/deployed;
only the test run is being narrowed). Do not change any other script.

**Verify**: `pnpm test --run` → exit 0; output shows `packages/core` and
`packages/react` suites passing and does **not** mention `apps/demo`. The
`--run` flag is forwarded to each package's `vitest`, so this runs once and exits
(no watch mode).

### Step 3: Re-enable type-checking of test files in core

In `packages/core/tsconfig.json`, remove the test-file globs from `exclude` so
test files are type-checked:

```jsonc
"exclude": ["node_modules", "dist"]
```

**Verify**: `pnpm --filter @gobrand/calendar-core run typecheck` → exit 0, no
errors. If the typecheck now reports errors in `*.test.ts` files, that is a real
pre-existing type problem the exclusion was hiding — see STOP conditions; do not
paper over it by re-adding the exclude.

### Step 4: Apply the same to react if it excludes tests

Read `packages/react/tsconfig.json`. If its `exclude` lists `**/*.test.ts` /
`**/*.test.tsx`, remove those globs the same way as Step 3. If it does not exclude
them, make no change.

**Verify**: `pnpm --filter @gobrand/react-calendar run typecheck` → exit 0.

### Step 5: Tidy the resolved TODO (optional but preferred)

In `TODO.md`, delete the "### Fix Test Type Checking" section (lines under
"## Technical Debt"), since Steps 3–4 resolve it. Leave the rest of `TODO.md`
untouched.

**Verify**: `grep -c "Fix Test Type Checking" TODO.md` → `0`.

### Step 6: Full green baseline

**Verify**: run all three and confirm each exits 0:
- `pnpm test --run`
- `pnpm typecheck`
- `pnpm build`

## Test plan

This plan changes configuration only — no new test code. The "test" is that the
workspace commands now pass:

- `pnpm test --run` exits 0 and runs exactly the `packages/core` and
  `packages/react` suites (230 tests total at time of writing).
- `pnpm typecheck` exits 0 with test files now included.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm test --run` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm build` exits 0
- [ ] Root `package.json` `test` script is `pnpm --filter "./packages/*" run test`
- [ ] `grep -n "\*\*/\*.test" packages/core/tsconfig.json` returns no matches
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 001 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm test --run` already passes at the start (Step 1) — the repo drifted and
  the demo issue may have been fixed another way; re-confirm before changing config.
- Removing the test exclude (Step 3 or 4) surfaces **type errors in test files**.
  Report the exact errors. These are the latent type issues the exclusion hid
  (`TODO.md` notes `calendar.test.ts` had generic-inference problems). Fixing them
  may be small, but it is a code change, not config — get confirmation on whether
  to fix the test types here or split into a follow-up plan.
- The `pnpm --filter "./packages/*"` syntax does not select the packages on this
  pnpm version (verify with `pnpm --filter "./packages/*" list --depth -1`).

## Maintenance notes

- If real unit tests are ever added to `apps/demo` or `apps/www`, decide
  deliberately whether they should join the root `test` run; the current narrowing
  deliberately keeps app tests out of the library suite.
- Reviewer should confirm CI (`.github/workflows/ci.yml` runs `pnpm test --run`)
  goes green after this — the workflow file itself is unchanged; the fix is in the
  script it invokes.
- Now that test files are typechecked, a broken type in a `*.test.ts` will fail
  `pnpm typecheck` — this is intended and is what catches public-API type
  regressions going forward.
