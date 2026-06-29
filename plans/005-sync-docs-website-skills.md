# Plan 005: Sync docs, website, and skills with the merged fixes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> This plan dispatches parallel subagents for the audit phase. If your
> environment cannot spawn subagents, do each audit section yourself,
> sequentially — the work and checks are identical.
>
> **Drift check (run first)**:
> `git diff --stat b081220..HEAD -- apps/www/content packages/core/README.md packages/react/README.md README.md skills`
> This plan is intentionally LAST and assumes plans 002, 003, 004 are merged.
> If they are not (see Depends on), STOP.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/002, plans/003, plans/004 (must all be DONE first)
- **Category**: docs
- **Planned at**: commit `b081220`, 2026-06-28

## Why this matters

Plans 001–004 change behavior (React reactivity now works) and a public utility
(`getTimezoneOffset` now returns correct fractional offsets), and refactor
internals (date-range consolidation). Docs drift silently when code changes; this
plan makes the documented surfaces match reality, then regenerates the derived
artifacts so nothing falls out of sync. Notably, `(react)/index.mdx` and
`packages/react/README.md` already *claim* "TanStack Store for optimal re-renders"
— that claim was effectively false before plan 002 and is true after it; the docs
should now show the reactive pattern actually working.

## Current state — the documentation system

**Single source of truth**: MDX files under `apps/www/content/docs/`. A generator
turns them into two derived artifacts. From `scripts/generate-docs.ts`:

- Reads `apps/www/content/docs/` (the `DOCS_DIR`).
- Writes `apps/www/public/llms.txt` (`LLMS_TXT_PATH`).
- Writes `skills/calendar/SKILL.md` (`SKILL_MD_PATH`).
- ALSO writes `~/.claude/skills/calendar/SKILL.md` (`GLOBAL_SKILL_DIR`, the user's
  home directory) — this is by design of the project's script. It is an expected
  side effect; the repo-tracked artifact that matters for review is
  `skills/calendar/SKILL.md`.
- Run with: `pnpm generate:docs` (root script → `tsx scripts/generate-docs.ts`).

**Consequence**: do NOT hand-edit `skills/calendar/SKILL.md` or
`apps/www/public/llms.txt` — they are generated. Edit the MDX, then regenerate.

Doc surfaces and what each plan touches:

| Surface | Files | Relevant change |
|---------|-------|-----------------|
| React docs | `apps/www/content/docs/(react)/index.mdx`, `(react)/api/use-view.mdx`, `(react)/api/use-calendar.mdx`, `(react)/api/calendar-provider.mdx`, `(react)/installation.mdx` | Plan 002: reactivity now real; confirm examples; confirm install (react-store is an auto-installed dependency, NOT a user install step) |
| React example pages | `apps/www/content/docs/(react)/examples/*.mdx` | Plan 002: verify the `useView`/`useCalendar` snippets reflect that context consumers re-render on navigation |
| Core docs | `apps/www/content/docs/core/*.mdx` | Plan 003: `getTimezoneOffset` is currently **not documented** in `core/utilities.mdx` — leave it that way unless you choose to add it correctly; Plan 004 is internal (no doc change) |
| READMEs | `packages/react/README.md`, `packages/core/README.md`, `README.md` (root) | Reactivity claim (react README:15); no API-surface change to document |
| Root TODO | `TODO.md` | The "Fix Test Type Checking" item is resolved by plan 001 if 001 already removed it; otherwise remove it here |

Verified facts (do not re-investigate):
- `getTimezoneOffset` appears in NO doc/README/skill file (grep returns nothing).
  Plan 003 therefore needs no doc change; only add documentation if you deliberately
  want to, and if so match the corrected behavior (`"+5:30"`, `"-3:30"`,
  whole-hours as `"+1"`).
- `@tanstack/react-store` is a regular runtime `dependency` of
  `@gobrand/react-calendar` (added in plan 002), so npm installs it automatically;
  installation docs do NOT need a new "install react-store" step.
- `create-calendar.mdx:208-209` shows `calendar.store.subscribe(...)` — still valid
  after all plans; do not remove it.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Regenerate derived docs | `pnpm generate:docs` | exit 0; writes llms.txt + SKILL.md |
| All tests | `pnpm test --run` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Build | `pnpm build` | exit 0 |

## Suggested executor toolkit

- If available, invoke `superpowers:dispatching-parallel-agents` for the Step 2
  fan-out.
- The `calendar` skill (`skills/calendar/SKILL.md`) documents this very library —
  read it for vocabulary, but remember it is generated, not edited.

## Scope

**In scope**:
- `apps/www/content/docs/**/*.mdx` — edit prose/examples where they contradict the
  merged behavior.
- `packages/react/README.md`, `packages/core/README.md`, `README.md` — same.
- `TODO.md` — drop resolved items.
- `skills/calendar/SKILL.md`, `apps/www/public/llms.txt` — only via
  `pnpm generate:docs`, never hand-edited.

**Out of scope** (do NOT touch):
- Any `packages/*/src/**` source or test files — this is a docs-only plan. If you
  find a code bug while writing docs, STOP and report it; do not fix it here.
- `meta.json` navigation files — do not reorder/rename pages.
- `apps/www` source/components/config (only `content/` MDX and `public/llms.txt`
  via generation).
- `scripts/generate-docs.ts` — do not modify the generator.

## Git workflow

- Branch: `advisor/005-docs-sync`
- Conventional commits, e.g.:
  1. `docs: align react reactivity docs and examples with working store subscription`
  2. `docs: regenerate llms.txt and SKILL.md`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Confirm prerequisites are merged

Confirm plans 002–004 are in the working tree (the reactivity fix and the
`getTimezoneOffset` fix exist):

- `grep -n "useSelector" packages/react/src/index.ts` → matches (plan 002 merged).
- `grep -n "60_000_000_000" packages/core/src/utils.ts` → matches (plan 003 merged).
- `grep -n "getMonthDateRange" packages/core/src/core/calendar.ts` → matches (plan 004 merged).

**Verify**: all three grep hits present. If any is missing, STOP — this plan is out
of order.

### Step 2: Audit each doc surface (parallel agents)

Dispatch the following subagents concurrently. Each is read-mostly: it audits its
surface against the merged code and edits ONLY where docs contradict reality.
Give each agent its file list, the verified facts above, and this instruction:
"Edit only the files listed. Do not touch source or tests. If a doc example would
need a code change to be correct, STOP and report instead of editing code."

- **Agent A — React docs & examples**
  Files: `apps/www/content/docs/(react)/index.mdx`,
  `apps/www/content/docs/(react)/api/use-view.mdx`,
  `apps/www/content/docs/(react)/api/use-calendar.mdx`,
  `apps/www/content/docs/(react)/api/calendar-provider.mdx`,
  `apps/www/content/docs/(react)/installation.mdx`,
  `apps/www/content/docs/(react)/examples/*.mdx`.
  Task: ensure every `useView`/`useCalendar`/`CalendarProvider` example reflects
  that **context consumers now re-render automatically on navigation** (the store
  subscription added in plan 002). Where a page describes manual re-render
  workarounds or implies consumers are static, correct it. Confirm the
  installation page does NOT tell users to install `@tanstack/react-store`
  separately (it is auto-installed). Keep code snippets minimal and runnable.

- **Agent B — Core docs**
  Files: `apps/www/content/docs/core/*.mdx`.
  Task: verify nothing documents the internal `computeDateRange` (plan 004 is an
  internal refactor; public `getMonthDateRange`/`getWeekDateRange`/`getDayDateRange`
  behavior is unchanged — no edits expected there). Decide whether to add a
  `getTimezoneOffset` entry to `core/utilities.mdx`; if you add it, document the
  corrected output (`"+5:30"`, `"-3:30"`, `"+1"`). If nothing is wrong, make no
  edits and report "no change needed."

- **Agent C — READMEs & TODO**
  Files: `packages/react/README.md`, `packages/core/README.md`, `README.md`,
  `TODO.md`.
  Task: confirm the "reactive state management" claim in the react README is now
  accurate (it is, post-002) — no change unless it overpromises. Remove any
  `TODO.md` items resolved by plans 001–004 (e.g. "Fix Test Type Checking" if plan
  001 did not already remove it). Do not invent new content.

Collect each agent's report (files changed, or "no change needed").

### Step 3: Regenerate derived artifacts

After all MDX/README edits are in, regenerate the generated files so `llms.txt` and
the skill stay in sync with the MDX:

`pnpm generate:docs`

**Verify**: exit 0. `git status` shows changes (if any) only in
`apps/www/public/llms.txt` and `skills/calendar/SKILL.md` from this step. (The
script also writes `~/.claude/skills/calendar/SKILL.md` outside the repo — that is
expected and will not appear in `git status`.)

### Step 4: Full verification

The library behavior must be untouched by a docs plan:

**Verify**:
- `pnpm test --run` → exit 0.
- `pnpm typecheck` → exit 0.
- `pnpm build` → exit 0.
- `git status` shows only files in the in-scope list modified.

## Test plan

No new automated tests — this is documentation. The guarantees are:
- `pnpm generate:docs` runs clean and the generated `llms.txt` / `SKILL.md` are
  consistent with the edited MDX.
- `pnpm test --run`, `pnpm typecheck`, `pnpm build` all still pass (proving no
  source was touched).
- Manual check: any code snippet edited in an MDX/README is syntactically valid and
  uses only the public API exported from `@gobrand/calendar-core` /
  `@gobrand/react-calendar`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm generate:docs` exits 0
- [ ] `pnpm test --run`, `pnpm typecheck`, `pnpm build` all exit 0
- [ ] `skills/calendar/SKILL.md` and `apps/www/public/llms.txt` are regenerated
      (not hand-edited) — their diff, if any, matches the MDX changes
- [ ] No `packages/*/src/**` file is modified (`git status` shows docs/MDX/README/
      generated only)
- [ ] `grep -rn "install.*react-store\|add.*react-store" apps/www/content README.md packages/*/README.md`
      returns no matches (react-store is not presented as a manual install)
- [ ] `plans/README.md` status row for 005 updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any of the three prerequisite greps in Step 1 is missing — plans 002–004 are not
  merged and this plan is premature.
- Writing a corrected doc example would require changing source code to make it true
  (report the discrepancy; it means a fix plan is incomplete).
- `pnpm generate:docs` fails, or it changes files other than `llms.txt` and
  `skills/calendar/SKILL.md` inside the repo.
- `pnpm test`/`typecheck`/`build` regress — a docs plan must not affect them; if it
  does, you edited something out of scope.

## Maintenance notes

- The docs pipeline is MDX → `generate:docs` → `llms.txt` + `SKILL.md` (repo) +
  `~/.claude/skills/calendar/SKILL.md` (global). Always edit MDX and regenerate;
  never edit the generated files directly.
- When future API changes land, add a step to that plan to update the relevant MDX
  and run `pnpm generate:docs`, so docs never drift again.
- Reviewer should confirm generated artifacts were regenerated (not hand-edited) by
  re-running `pnpm generate:docs` and seeing a clean tree.
