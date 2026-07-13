# React Calendar Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace incomplete React Calendar examples with concise, source-accurate npm and website documentation.

**Architecture:** The npm README teaches the smallest useful controller and projection flow with plain HTML and links to full website examples. The website introduction expands that same mental model, while advanced Suspense pages contain locally complete examples and all styled examples remain explicitly website-local.

**Tech Stack:** TypeScript, React 18/19, Temporal polyfill, MDX, TanStack Start, Fumadocs

## Global Constraints

- Do not change runtime APIs or package exports.
- Do not present website-local styled components as `@gobrand/react-calendar` exports.
- Do not use undefined placeholder components, query objects, or data fields.
- Keep the npm page concise and link to exact website routes for runnable and Suspense examples.
- Use only real properties from the shipped month, week, and day view models.
- Do not publish, deploy, push, or modify the untracked `AGENTS.md` file.

---

### Task 1: Rewrite the npm quick start

**Files:**
- Modify: `packages/react/README.md`

**Interfaces:**
- Consumes: `Temporal`, `useCreateCalendar`, and the shipped `activeView` discriminated union.
- Produces: the README rendered on npm for `@gobrand/react-calendar`.

- [ ] **Step 1: Replace the incomplete simple and Suspense snippets**

Write one concrete `Event` array and a `Calendar` component. Configure `views: { month: true, week: true, day: true }`, pass `items` and `getDate`, render navigation/view buttons, and switch over `calendar.activeView.view`. Month reads `weeks`, week reads `days`, and day reads `items`.

- [ ] **Step 2: Add exact documentation links**

Link the runnable example to `https://calendar.gobrand.app/docs/examples/multi-view` and the optional Suspense guide to `https://calendar.gobrand.app/docs/data-and-suspense`.

- [ ] **Step 3: Verify package-facing content**

Run `rg -n "CalendarContent|CalendarControls|CalendarSkeleton|ActiveView|MonthGrid|monthQuery|eventsQuery" packages/react/README.md` and expect no matches. Run `pnpm --filter @gobrand/react-calendar typecheck` and expect exit 0.

### Task 2: Align the website learning path

**Files:**
- Modify: `apps/www/content/docs/(react)/index.mdx`
- Modify: `apps/www/content/docs/(react)/first-calendar.mdx`
- Modify: `apps/www/content/docs/(react)/data-and-suspense.mdx`
- Modify: `apps/www/content/docs/(react)/api/calendar-provider.mdx`
- Modify: `apps/www/content/docs/(react)/api/use-calendar-view.mdx`
- Modify: `apps/www/content/docs/(react)/examples/basic-month.mdx`
- Modify: `apps/www/content/docs/(react)/examples/multi-view.mdx`
- Modify: `apps/www/content/docs/(react)/examples/day-view.mdx`
- Modify: `apps/www/content/docs/(react)/examples/week-view.mdx`
- Modify: `apps/www/src/components/examples/basic-month.tsx`
- Modify: `apps/www/src/components/examples/mock-data.ts`

**Interfaces:**
- Consumes: source-backed `CalendarPreview` examples and the shipped React hooks.
- Produces: the introductory, advanced composition, API, and example pages linked from npm.

- [ ] **Step 1: Make the introduction concrete**

Explain controller state, `activeView`, and headless rendering in short sentences. Show a real month-only hook call and point to the first-calendar and multi-view pages.

- [ ] **Step 2: Keep the first calendar focused**

Retain the real month-only call, explain its inferred `MonthView`, and replace jargon-heavy prose with direct ownership statements and exact live-example links.

Make the source-backed `BasicMonthExample` use simple mode with static demo events so the first live example does not introduce Provider, Suspense, or a query library.

- [ ] **Step 3: Make advanced snippets locally complete**

In the Suspense and provider pages, define the controls and active child shown in the snippet. In `useCalendarView`, define query options inline using `calendar.visibleRange`; do not reference a missing `eventsQuery`. Render output with plain HTML so no missing `MonthGrid` exists.

- [ ] **Step 4: Clarify live example descriptions**

Give every example page a concise description and explain that the preview source imports website-local presentation helpers while all calendar state and projection calls use the public package.

- [ ] **Step 5: Verify website content**

Run the placeholder scan across `packages/react/README.md` and `apps/www/content/docs`. Run `pnpm --filter @gobrand/calendar-docs typecheck` and `pnpm --filter @gobrand/calendar-docs build`; expect exit 0.

### Task 3: Final package and repository verification

**Files:**
- Modify: `scripts/generate-docs.ts`
- Generate: `apps/www/public/llms.txt`
- Generate: `skills/calendar/SKILL.md`
- Modify: `fixtures/package-consumer/skill-examples.tsx`
- Modify: `scripts/verify-packages.ts`

**Interfaces:**
- Consumes: React MDX frontmatter and the public website route structure.
- Produces: agent-facing documentation with valid links and the same real quick start as npm.

- [ ] **Step 1: Correct route-group URL generation**

Map `(react)` to no public path segment, while preserving `core` as `/core`. Update the fixed React installation link to `/installation`.

- [ ] **Step 2: Simplify the generated skill**

Remove the required `@tanstack/react-query` install and the long hardcoded Suspense application. Install `@js-temporal/polyfill` because the example imports it directly. Generate a concrete month/week/day quick start using `Temporal`, `useCreateCalendar`, and real discriminated view properties, followed by the exact Suspense guide URL.

- [ ] **Step 3: Regenerate and verify agent docs**

Run `pnpm generate:docs`. Search `apps/www/public/llms.txt` and `skills/calendar/SKILL.md` for `/docs/react/`, `CalendarContent`, undefined active-view components, and a required TanStack Query installation; expect no matches.

- [ ] **Step 4: Compile the agent quick start against packed packages**

Replace the stale package-consumer Suspense fixture with the generated month/week/day quick start, remove its TanStack Query dependency, and run `pnpm verify:packages`; expect exit 0.

### Task 4: Final package and repository verification

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: evidence that the docs match the shipped API and compile in the repository.

- [ ] **Step 1: Build the React package**

Run `pnpm --filter @gobrand/react-calendar build` and expect exit 0.

- [ ] **Step 2: Run repository checks relevant to the change**

Run `pnpm lint` and inspect `git diff --check`; expect exit 0.

- [ ] **Step 3: Review the final diff**

Confirm every README link targets an existing website route, every identifier in code snippets is defined, language is concise, and `AGENTS.md` remains untouched.
