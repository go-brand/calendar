# Calendar View DX and Progressive Examples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add natural view-model names and typed view enumeration, then reorganize every public example into a progressive, real-use-case learning path and publish a patch release.

**Architecture:** Core view projections return both the new required `name` discriminator and deprecated `view` alias. Controllers expose the already-derived configured name order through `viewNames`. React consumes those core contracts unchanged, while documentation generation keeps README, website, skill, fixtures, and `llms.txt` synchronized.

**Tech Stack:** TypeScript, Temporal polyfill, React 18/19, Vitest, MDX, TanStack Query, Fumadocs, tsup, Cloudflare Workers

## Global Constraints

- `VisibleRange` remains `{ start, end }`; `end` is documented as exclusive.
- `name` is required on month, week, and day view models.
- Deprecated `view` remains required and equal to `name` for compatibility.
- `viewNames` preserves configured input order and is typed as `readonly ConfiguredView<TViews>[]`.
- The principal example uses one month, one hook, local events, and only `getDate`.
- Each advanced example teaches one real case; do not combine multi-view dispatch with Suspense fetching.
- Do not modify or commit the untracked `AGENTS.md`.
- Release with `pnpm release patch`, then deploy with `pnpm --dir apps/www run deploy`.

---

### Task 1: Core view names and typed controller enumeration

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/core/calendar.ts`
- Modify: `packages/core/src/core/projections.ts`
- Modify: `packages/core/src/utils/buildMonth.ts`
- Modify: `packages/core/src/utils/buildWeek.ts`
- Modify: `packages/core/src/utils/buildDay.ts`
- Test: `packages/core/src/core/calendar-v1.test.ts`
- Test: `packages/core/src/core/projections.test.ts`

**Interfaces:**
- Produces: `MonthView.name`, `WeekView.name`, `DayView.name`, and `CalendarController.viewNames`.
- Preserves: deprecated `view` discriminator and `VisibleRange.end`.

- [ ] **Step 1: Write failing projection tests**

Assert each projection has matching names:

```ts
expect(month).toMatchObject({ name: 'month', view: 'month' })
expect(week).toMatchObject({ name: 'week', view: 'week' })
expect(day).toMatchObject({ name: 'day', view: 'day' })
```

- [ ] **Step 2: Run the focused projection tests and verify RED**

Run `pnpm test projections --run`. Expect failures because `name` is absent.

- [ ] **Step 3: Write a failing controller test**

Create a controller configured as `{ week: true, month: true }` and assert:

```ts
expect(calendar.viewNames).toEqual(['week', 'month'])
```

- [ ] **Step 4: Run the focused controller test and verify RED**

Run `pnpm test calendar-v1 --run`. Expect failure because `viewNames` is absent.

- [ ] **Step 5: Implement the minimal core contract**

Add required literal `name` fields and deprecated literal `view` fields to public and internal produced view shapes. Return both fields from every constructor. Add `readonly viewNames: readonly ConfiguredView<TViews>[]` and return the existing configured-name array from the controller.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run `pnpm test projections --run` and `pnpm test calendar-v1 --run`; expect both to pass.

### Task 2: React typing and compatibility

**Files:**
- Modify: `packages/react/src/v1.test.tsx`
- Modify as required: `packages/react/src/index.ts`
- Modify: `fixtures/package-consumer/index.tsx`

**Interfaces:**
- Consumes: named core projections and typed `viewNames`.
- Produces: React inference through `activeView.name` and `useCalendarView(...).name`.

- [ ] **Step 1: Convert React assertions to the new discriminator**

Use `activeView.name` for normal narrowing and retain one explicit assertion that deprecated `activeView.view` still equals the same name. Add a compile-time use of `calendar.viewNames` in the package-consumer fixture.

- [ ] **Step 2: Run React tests and type checks**

Run `pnpm --filter @gobrand/react-calendar test --run` and `pnpm --filter @gobrand/react-calendar typecheck`; expect exit 0.

### Task 3: Progressive live examples

**Files:**
- Modify: `apps/www/src/components/examples/basic-month.tsx`
- Modify: `apps/www/src/components/examples/week-view.tsx`
- Modify: `apps/www/src/components/examples/day-view.tsx`
- Modify: `apps/www/src/components/examples/multi-view.tsx`
- Modify: `apps/www/src/components/examples/registry.tsx`
- Create: `apps/www/src/components/examples/date-picker.tsx`
- Create: `apps/www/src/components/examples/suspense-month.tsx`
- Modify as needed: `apps/www/src/components/examples/mock-data.ts`

**Interfaces:**
- Produces: focused registry entries for basic month, date picker, simple week, timed week/day, multi-view, and Suspense query.

- [ ] **Step 1: Simplify the principal month**

Keep simple-mode local events and `getDate`; remove `getStart`, context, and fetching.

- [ ] **Step 2: Add the data-free date picker**

Use `useCreateCalendar({ views: { month: true } })` plus `useCalendarView({ calendar, view: 'month' })`. Select with `calendar.setDate(day.date)` and compare `day.date.equals(calendar.date)`.

- [ ] **Step 3: Separate simple and timed views**

Simple week uses local items and only `getDate`. Timed week/day use both `getDate` and `getStart` because they render slots.

- [ ] **Step 4: Focus multi-view on dispatch**

Use local events, `calendar.viewNames`, and `view.name`; remove Provider, Suspense, and query code. Rename local components to `MonthCalendar`, `WeekCalendar`, and `DayCalendar`.

- [ ] **Step 5: Add the focused Suspense month**

Keep controls above Suspense and query/project month data below it through Provider/context. Do not add view switching or timed slots.

- [ ] **Step 6: Run website typecheck**

Run `pnpm --filter @gobrand/calendar-docs typecheck`; expect exit 0.

### Task 4: README, website, skill, fixtures, and generated docs

**Files:**
- Modify: `packages/react/README.md`
- Modify: `apps/www/content/docs/(react)/index.mdx`
- Modify: `apps/www/content/docs/(react)/first-calendar.mdx`
- Modify: `apps/www/content/docs/(react)/data-and-suspense.mdx`
- Modify/Create: `apps/www/content/docs/(react)/examples/*.mdx`
- Modify: `apps/www/content/docs/(react)/examples/meta.json`
- Modify: `apps/www/content/docs/(react)/types/views.mdx`
- Modify: `scripts/generate-docs.ts`
- Generate: `skills/calendar/SKILL.md`
- Generate: `apps/www/public/llms.txt`
- Modify: `fixtures/package-consumer/skill-examples.tsx`

**Interfaces:**
- Consumes: `name`, `viewNames`, and the focused live registry.
- Produces: synchronized human-facing and agent-facing documentation.

- [ ] **Step 1: Make the basic month canonical**

Use one month, one hook, local events, and only `getDate` in README, landing docs, first-calendar, and generated skill source.

- [ ] **Step 2: Align example pages with one use case each**

Add the date-picker and focused Suspense previews, point data-and-suspense to the focused preview, and describe where timed accessors first appear.

- [ ] **Step 3: Replace repository `.view` consumers**

Use `.name` for normal view-model narrowing throughout docs, examples, demo, tests, and fixtures. Keep `.view` only in types, constructors, deprecation text, and explicit compatibility assertions.

- [ ] **Step 4: Regenerate documentation**

Run `pnpm generate:docs`. Confirm the generated skill and `llms.txt` reflect source content.

- [ ] **Step 5: Run source scans**

Run searches for `view.view`, `activeView.view`, `Object.keys(calendar.views)`, and `getStart` in the principal example surfaces. Expect only approved compatibility or advanced-example matches.

### Task 5: Full verification and implementation commit

**Files:**
- Verify all changed files.
- Exclude: `AGENTS.md`.

**Interfaces:**
- Produces: a clean implementation commit ready for release.

- [ ] **Step 1: Run repository verification**

Run `pnpm test --run`, `pnpm typecheck`, `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm verify:packages`, `pnpm --filter @gobrand/calendar-docs build`, and `git diff --check`. Every command must exit 0.

- [ ] **Step 2: Review requirements and diff**

Confirm `end` is unchanged, new fields are present, examples are progressive, generated artifacts are synchronized, and `AGENTS.md` is excluded.

- [ ] **Step 3: Commit implementation**

Stage only intended files and commit with `feat: improve calendar view DX`.

### Task 6: Patch release and website deployment

**Files:**
- Release-generated: `packages/core/package.json`
- Release-generated: `packages/react/package.json`

**Interfaces:**
- Produces: next patch tag, pushed branch/tag, npm publish workflow, and deployed website.

- [ ] **Step 1: Run patch release**

Run `pnpm release patch`. It must rerun tests, type checks, and builds; create the patch version commit/tag; and push the current branch and tag.

- [ ] **Step 2: Deploy documentation**

Run `pnpm --dir apps/www run deploy`. Record the successful Cloudflare deployment URL/version.

- [ ] **Step 3: Verify release state**

Confirm the branch and tag exist on the remote and report the exact patch version. Do not claim npm publication complete unless the release workflow confirms it.
