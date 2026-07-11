# Calendar Site Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship the `true | options` Calendar view shorthand and a Calendar-first public website with source-backed live examples, a Temporal DST/range lab, richer human/agent documentation, and one contextual Tiempo mention.

**Architecture:** Core normalizes shorthand view inputs once and exposes canonical object configs to projections. The website registers real compiled example modules alongside Vite `?raw` imports, then reuses one shadcn-style preview surface in MDX and on the landing page. The landing route becomes composition over focused sections and interactive teaching components.

**Tech Stack:** TypeScript 5.7/5.9, React 19, TanStack Start, Fumadocs, Vite raw imports, DynamicCodeBlock/Shiki, Tailwind CSS v4, Motion, Vitest.

## Global Constraints

- Calendar remains the primary product; Tiempo appears exactly once as a one-line companion link and never in Calendar examples.
- Default views use `true`; custom week/day geometry uses an object; omission disables; `false` is rejected.
- Normalize shorthand once so controller/projection internals consume object configs only.
- Example code must come from the exact compiled TSX module through `?raw`; no duplicated code strings.
- Follow shadcn's preview/source architecture without copying its Next.js registry implementation or adding a browser compiler.
- React is the primary learning path; Core remains clearly documented as the framework-agnostic engine.
- Use Temporal exclusively for calendar and DST/range behavior.
- Preserve the current package build, type, client-boundary, and packed-consumer contracts.
- Do not publish, deploy, or modify the Tiempo repository.

---

### Task 1: View shorthand and canonical normalization

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/core/calendar.ts`
- Modify: `packages/core/src/core/calendar-v1.test.ts`
- Modify: `packages/core/src/core/projections.ts`
- Modify: `packages/core/src/core/projections.test.ts`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/react/src/v1.test.tsx`
- Modify: `fixtures/package-consumer/index.tsx`

**Interfaces:**
- Produces: `ViewConfig` input values `{ month: true; week: true | TimedViewConfig; day: true | TimedViewConfig }`.
- Produces: `ResolvedViewConfig` and `ResolvedCalendarViews<TViews>` so `calendar.views` always contains object configs.
- Preserves: exact `ConfiguredView<TViews>` narrowing.

- [x] **Step 1: Add failing runtime and type assertions**

Cover `month: true`, `week: true`, custom week geometry, canonical `calendar.views.week`, rejected `false`, missing keys, and packed declaration narrowing.

```ts
const calendar = createCalendar({ views: { month: true, week: true } })
expect(calendar.views.month).toEqual({})
expect(calendar.views.week).toEqual({})
expect(() => createCalendar({ views: { month: false } } as never)).toThrow(
  'must be true or an options object',
)
```

Run: `pnpm test packages/core/src/core/calendar-v1.test.ts packages/core/src/core/projections.test.ts packages/react/src/v1.test.tsx --run`

Expected: RED because `true` is not accepted by current types/runtime.

- [x] **Step 2: Implement input and resolved types**

```ts
export type ViewConfig = {
  month: true
  week: true | TimedViewConfig
  day: true | TimedViewConfig
}

export type ResolvedViewConfig = {
  month: Record<string, never>
  week: TimedViewConfig
  day: TimedViewConfig
}

export type ResolvedCalendarViews<TViews extends NonEmptyCalendarViews> = Readonly<{
  [TName in ConfiguredView<TViews>]: ResolvedViewConfig[TName]
}>
```

Update controller/projection overloads to keep input generics while consuming `ResolvedCalendarViews<TViews>`.

- [x] **Step 3: Normalize and validate once in `createCalendar`**

Build a canonical `views` object from present keys. Normalize `true` to `{}`, preserve option objects, reject `false`, null, arrays, and unknown view names synchronously. Return canonical `views` from the controller and store it in metadata.

- [x] **Step 4: Verify the shorthand contract**

Run: `pnpm test packages/core/src/core/calendar-v1.test.ts packages/core/src/core/projections.test.ts packages/react/src/v1.test.tsx --run && pnpm typecheck && pnpm build && pnpm verify:packages`

Expected: all selected tests, all four workspace typechecks, builds, and packed fixtures pass.

### Task 2: Migrate first-party and downstream view declarations

**Files:**
- Modify: `apps/www/src/**/*.tsx`
- Modify: `apps/www/content/docs/**/*.mdx`
- Modify: `packages/*/README.md`
- Modify: `scripts/generate-docs.ts`
- Modify: `fixtures/package-consumer/*.tsx`
- Modify: `/Users/rubencostamartinez/Desktop/temporal-calendar/apps/demo/src/**/*.tsx`
- Modify: `/Users/rubencostamartinez/Desktop/tanstack-start/packages/ui/src/plain-date-calendar.tsx`
- Modify: `/Users/rubencostamartinez/Desktop/tanstack-start/apps/app/src/features/calendar/**/*.tsx`

**Interfaces:**
- Consumes: Task 1 shorthand.
- Produces: no first-party empty view objects for default geometry.

- [x] **Step 1: Replace default empty objects with `true`**

Use `month: true`, `week: true`, and `day: true`. Preserve option objects only when at least one geometry option is supplied.

- [x] **Step 2: Make stale syntax detectable**

Run: `rg -n "(month|week|day): \{\}" packages apps fixtures scripts skills --glob '!**/dist/**'`

Expected: no first-party default-view matches.

- [x] **Step 3: Verify migrated consumers**

Run Calendar repo tests/typechecks, the nested demo typecheck/build, focused TanStack Calendar Biome checks, and the existing plain-date browser test against local v1 declarations.

Expected: no shorthand API errors; unrelated TanStack worktree failures remain separately reported.

### Task 3: Source-backed example registry and preview chrome

**Files:**
- Rewrite: `apps/www/src/components/preview/index.tsx`
- Create: `apps/www/src/components/examples/registry.tsx`
- Refactor: `apps/www/src/components/examples/basic-month.tsx`
- Refactor: `apps/www/src/components/examples/week-view.tsx`
- Refactor: `apps/www/src/components/examples/day-view.tsx`
- Refactor: `apps/www/src/components/examples/multi-view.tsx`
- Modify: `apps/www/src/routes/docs/$.tsx`
- Modify: `apps/www/content/docs/(react)/examples/*.mdx`

**Interfaces:**
- Produces: `CalendarExampleName`, `calendarExamples`, and `<CalendarPreview name="..." />`.
- Consumes: compiled component plus the same file through `?raw`.

- [x] **Step 1: Split examples into render-only modules**

Remove `Preview` imports and manual `const code` strings. Each module exports a focused interactive example component.

- [x] **Step 2: Add a typed raw-source registry**

```tsx
import basicMonthSource from './basic-month.tsx?raw'
import { BasicMonthExample } from './basic-month'

export const calendarExamples = {
  'basic-month': {
    component: BasicMonthExample,
    source: basicMonthSource,
    title: 'Basic month',
    description: 'A navigable month with inferred event types.',
  },
} as const
```

- [x] **Step 3: Implement shadcn-style preview/source composition**

Render the live component first, a three-line `DynamicCodeBlock` excerpt, gradient **View code**, full source, **Copy**, and **Collapse**. Use semantic buttons, `aria-expanded`, keyboard focus, and reduced-motion-safe transitions.

- [x] **Step 4: Register one MDX component**

Expose `CalendarPreview` from the docs route and replace example-specific MDX wrappers with stable registry names.

- [x] **Step 5: Verify source identity**

Run `pnpm --filter @gobrand/calendar-docs typecheck && pnpm --filter @gobrand/calendar-docs build` and browser-check preview, expansion, copy, mobile behavior, and a calendar navigation interaction.

Expected: displayed source is imported from the compiled example file and the website builds/prerenders.

### Task 4: Calendar-first landing page and DST range lab

**Files:**
- Rewrite: `apps/www/src/routes/index.tsx`
- Create: `apps/www/src/components/landing/calendar-hero.tsx`
- Create: `apps/www/src/components/landing/calendar-problems.tsx`
- Create: `apps/www/src/components/landing/dst-range-lab.tsx`
- Create: `apps/www/src/components/landing/calendar-architecture.tsx`
- Create: `apps/www/src/components/landing/learning-paths.tsx`
- Create: `apps/www/src/components/landing/tiempo-callout.tsx`
- Modify: `apps/www/src/styles/app.css`

**Interfaces:**
- Consumes: Task 3 registry and Task 1 shorthand.
- Produces: a focused public narrative and interactive Temporal teaching tool.

- [x] **Step 1: Load the frontend-design skill and define the visual system**

Use one time-instrument visual language: neutral surfaces, one cool Temporal accent, range brackets, offset labels, and grid rules. Avoid generic feature-card repetition and ornamental gradients.

- [x] **Step 2: Compose the landing page from focused sections**

The route becomes a small composition layer. Hero includes the minimal source-backed calendar and installation command. Subsequent sections map hidden bugs to explicit Calendar contracts, explain controller/projection separation, link human/agent resources, and end with the Tiempo one-liner.

- [x] **Step 3: Implement the DST range lab**

Provide timezone/date presets including New York spring-forward and fall-back. Compute local midnight boundaries with Temporal, show elapsed hours, offsets, and the half-open query predicate. Keep all values derived from the selected timezone.

- [x] **Step 4: Verify interaction and responsive behavior**

Run website typecheck/build, then inspect desktop and mobile layouts, keyboard focus, reduced motion, calendar navigation, and both DST presets in the browser.

Expected: presets visibly report 23 and 25 elapsed hours and no horizontal overflow occurs.

### Task 5: Rich docs and agent-facing outputs

**Files:**
- Rewrite/reorder: `apps/www/content/docs/(react)/**/*.mdx`
- Rewrite/reorder: `apps/www/content/docs/core/**/*.mdx`
- Modify: `apps/www/content/docs/**/meta.json`
- Modify: `scripts/generate-docs.ts`
- Regenerate: `apps/www/public/llms.txt`
- Regenerate: `skills/calendar/SKILL.md`

**Interfaces:**
- Consumes: canonical Task 1 syntax and Task 3 example names.
- Produces: React-first learning path plus searchable agent artifacts.

- [x] **Step 1: Reorder documentation around user tasks**

Lead React readers through first calendar, navigation, data/projections, Suspense, timezones/ranges, controlled routing, examples, then API. Keep Core focused on controller, projections, range contract, and utilities.

- [x] **Step 2: Add behavior-rich explanations**

Name the timezone boundary, DST day length, half-open query rule, controlled-state contract, and independent projection types explicitly. Use source-backed previews wherever behavior is introduced.

- [x] **Step 3: Regenerate agent artifacts**

Run `pnpm generate:docs` and validate the generated skill. Ensure `llms.txt` and the skill contain `true` shorthand plus minimal, Suspense, independent-item, timezone, and controlled-state patterns.

- [x] **Step 4: Scan for obsolete teaching**

Run source scans for empty default configs, old factories/hooks, inclusive range ends, duplicated code strings, and Tiempo imports in Calendar examples.

Expected: no obsolete public syntax or Calendar-example Tiempo dependency remains.

### Task 6: Full acceptance verification

**Files:**
- Modify only files required by failures introduced in Tasks 1-5.

**Interfaces:**
- Verifies: package, website, example, agent, accessibility, and downstream contracts.

- [x] **Step 1: Run repository gates**

Run: `pnpm lint && pnpm format:check && pnpm test --run && pnpm typecheck && pnpm build && pnpm verify:packages`

- [x] **Step 2: Run generation and skill validation**

Run `pnpm generate:docs`, the Calendar skill validator, then repeat website typecheck/build so generated outputs are included.

- [x] **Step 3: Run browser acceptance**

Check landing desktop/mobile, source expansion/copy, example interaction, DST presets, docs navigation, keyboard focus, console errors, and broken links.

- [x] **Step 4: Audit all touched repositories**

Run `git status --short`, `git diff --check`, and scoped diff stats in Calendar, the nested demo, and TanStack Start. Preserve unrelated dirty changes and do not release or deploy.
