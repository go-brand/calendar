# Calendar Site Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace presentation-heavy Calendar examples with concise design-system-style primitives and rebuild the landing page as a responsive vertical story using the original neutral/sky/cyan visual language.

**Architecture:** A local `calendar-ui.tsx` module owns all example-only markup, Tailwind classes, buttons, and accessibility details while source-backed example modules retain Calendar state, queries, projections, and iteration. The landing page stacks its copy, preview, benefits, DST lab, and learning links in independent bounded rows so source expansion only changes vertical flow.

**Tech Stack:** TypeScript 5.9, React 19, TanStack Start, Fumadocs, Vite `?raw`, Tailwind CSS v4, Temporal, Vitest package tests, browser acceptance.

## Global Constraints

- `calendar-ui.tsx` is example presentation code and must never be exported from `@gobrand/calendar-core` or `@gobrand/react-calendar`.
- The exact compiled example module remains the source displayed by `CalendarPreview`; no duplicated source strings.
- Example modules contain Calendar behavior and iteration but no long presentation `className` strings.
- The landing page inherits the default Fumadocs neutral background and uses sky/cyan as its only accent family.
- Remove the page-wide grid pattern, green-tinted background, violet accent, condensed display face, bug table, and architecture tree.
- Source expansion must only add vertical space below its preview and must not change any preceding element's position or width.
- The page must have no horizontal overflow at a 390px viewport.
- Preserve keyboard focus, reduced-motion behavior, source copy/collapse controls, and internal calendar navigation.
- Do not change Calendar controller, projection, timezone, or range behavior.
- Do not publish, deploy, push, or modify the Tiempo repository.

---

### Task 1: Create example presentation primitives and migrate the basic month

**Files:**
- Create: `apps/www/src/components/examples/calendar-ui.tsx`
- Modify: `apps/www/src/components/examples/basic-month.tsx`

**Interfaces:**
- Produces: `Button`, `Calendar`, `CalendarToolbar`, `CalendarWeekdays`, `CalendarGrid`, `CalendarRow`, `CalendarCell`, `CalendarEvent`, `CalendarTimeline`, `CalendarTimeRow`, `CalendarWeekHeader`, `CalendarTimeGrid`, `CalendarTimeGridRow`, and `CalendarTimeCell`.
- Consumes: `Temporal.PlainDate` for weekday and cell labels.
- Preserves: `BasicMonthExample` as the source-backed registry export.

- [ ] **Step 1: Make `basic-month.tsx` consume the missing local UI vocabulary**

Replace its presentation markup with this structure before creating the module:

```tsx
import {
  Calendar,
  CalendarCell,
  CalendarEvent,
  CalendarGrid,
  CalendarRow,
  CalendarToolbar,
  CalendarWeekdays,
} from './calendar-ui'

function MonthContent() {
  const calendar = useCalendar()
  const { start, end } = calendar.visibleRange
  const { data: events } = useSuspenseQuery({
    queryKey: ['events', start.toString(), end.toString()],
    queryFn: () => fetchEvents(start, end),
  })
  const month = useCalendarView({
    view: 'month',
    items: events,
    getDate: accessor.getDate,
    getStart: accessor.getStart,
  })

  return (
    <>
      <CalendarWeekdays start={calendar.visibleRange.start.toPlainDate()} />
      <CalendarGrid>
        {month.weeks.map((week) => (
          <CalendarRow key={week[0].id}>
            {week.map((day) => (
              <CalendarCell
                key={day.id}
                date={day.date}
                current={day.isCurrentMonth}
                today={day.isToday}
              >
                {day.items.map((event) => (
                  <CalendarEvent key={event.id}>{event.title}</CalendarEvent>
                ))}
              </CalendarCell>
            ))}
          </CalendarRow>
        ))}
      </CalendarGrid>
    </>
  )
}
```

- [ ] **Step 2: Run the website typecheck to verify the missing module fails**

Run: `pnpm --filter @gobrand/calendar-docs typecheck`

Expected: FAIL with `Cannot find module './calendar-ui'`.

- [ ] **Step 3: Create the complete presentation module**

Create `calendar-ui.tsx` with these exact public props and presentation ownership:

```tsx
import type { Temporal } from '@js-temporal/polyfill'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Button({
  active = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'rounded-lg px-3 py-2 text-sm text-fd-muted-foreground transition-colors',
        'hover:bg-fd-muted hover:text-fd-foreground',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400',
        active && 'bg-fd-primary text-fd-primary-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function Calendar({
  children,
  size = 'month',
}: {
  children: ReactNode
  size?: 'month' | 'day' | 'wide'
}) {
  const widths = { month: 'max-w-2xl', day: 'max-w-md', wide: 'max-w-3xl' }
  return <div className={cn('w-full min-w-0', widths[size])}>{children}</div>
}

export function CalendarToolbar({
  title,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
  children,
}: {
  title: string
  onPrevious: () => void
  onNext: () => void
  previousLabel: string
  nextLabel: string
  children?: ReactNode
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Button aria-label={previousLabel} onClick={onPrevious}>←</Button>
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button aria-label={nextLabel} onClick={onNext}>→</Button>
      </div>
      {children && <div className="flex justify-center gap-1">{children}</div>}
    </div>
  )
}

export function CalendarWeekdays({ start }: { start: Temporal.PlainDate }) {
  const days = Array.from({ length: 7 }, (_, index) =>
    start.add({ days: index }).toLocaleString('en-US', { weekday: 'short' }),
  )
  return (
    <div className="mb-2 grid grid-cols-7">
      {days.map((day) => <div key={day} className="py-2 text-center text-xs text-fd-muted-foreground">{day}</div>)}
    </div>
  )
}

export function CalendarGrid({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>
}

export function CalendarRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-7 gap-1">{children}</div>
}

export function CalendarCell({
  date,
  current = true,
  today = false,
  children,
}: {
  date: Temporal.PlainDate
  current?: boolean
  today?: boolean
  children?: ReactNode
}) {
  return (
    <div className={cn('min-h-20 rounded-lg border p-2', current ? 'border-fd-border bg-fd-card' : 'border-transparent opacity-40')}>
      <span className={cn('inline-grid size-6 place-items-center rounded-full text-sm', today && 'bg-sky-500 font-medium text-white')}>
        {date.day}
      </span>
      {children && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  )
}

export function CalendarEvent({ children }: { children: ReactNode }) {
  return <div className="truncate rounded bg-sky-500 px-1.5 py-0.5 text-xs text-white">{children}</div>
}

export function CalendarTimeline({ children }: { children: ReactNode }) {
  return <div className="max-h-96 overflow-y-auto rounded-lg border border-fd-border">{children}</div>
}

export function CalendarTimeRow({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="grid min-h-12 grid-cols-[4.5rem_1fr] border-b border-fd-border last:border-b-0">
      <div className="border-r border-fd-border p-2 text-xs text-fd-muted-foreground">{label}</div>
      <div className="min-w-0 p-2">{children}</div>
    </div>
  )
}

type WeekHeaderDay = {
  id: string
  date: Temporal.PlainDate
  isToday: boolean
}

export function CalendarWeekHeader({ days }: { days: readonly WeekHeaderDay[] }) {
  return (
    <div className="grid grid-cols-[3.75rem_repeat(7,minmax(0,1fr))] border-b border-fd-border bg-fd-muted/20">
      <div />
      {days.map((day) => (
        <div key={day.id} className="border-l border-fd-border p-2 text-center">
          <div className="text-xs text-fd-muted-foreground">{day.date.toLocaleString('en', { weekday: 'short' })}</div>
          <div className={cn('mx-auto mt-1 grid size-8 place-items-center rounded-full', day.isToday && 'bg-sky-500 text-white')}>
            {day.date.day}
          </div>
        </div>
      ))}
    </div>
  )
}

export function CalendarTimeGrid({ header, children }: { header: ReactNode; children: ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-fd-border">{header}<div className="max-h-96 overflow-y-auto">{children}</div></div>
}

export function CalendarTimeGridRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[3.75rem_repeat(7,minmax(0,1fr))] border-b border-fd-border last:border-b-0">
      <div className="border-r border-fd-border bg-fd-muted/10 p-2 text-xs text-fd-muted-foreground">{label}</div>
      {children}
    </div>
  )
}

export function CalendarTimeCell({ children }: { children?: ReactNode }) {
  return <div className="min-h-12 min-w-0 border-l border-fd-border p-1">{children}</div>
}
```

- [ ] **Step 4: Finish `BasicMonthExample` with the shared toolbar and calendar surface**

Use this outer structure and keep fetching/projection code unchanged:

```tsx
export function BasicMonthExample() {
  const calendar = useCreateCalendar({ views: { month: true } })
  return (
    <CalendarProvider calendar={calendar}>
      <Calendar size="month">
        <Toolbar />
        <Suspense fallback={<div>Loading…</div>}><MonthContent /></Suspense>
      </Calendar>
    </CalendarProvider>
  )
}

function Toolbar() {
  const calendar = useCalendar()
  return (
    <CalendarToolbar
      title={calendar.title()}
      previousLabel="Previous month"
      nextLabel="Next month"
      onPrevious={calendar.previous}
      onNext={calendar.next}
    />
  )
}
```

- [ ] **Step 5: Verify the first concise example**

Run:

```bash
pnpm --filter @gobrand/calendar-docs typecheck
rg -n "className=" apps/www/src/components/examples/basic-month.tsx
```

Expected: typecheck PASS and the source scan returns no matches.

### Task 2: Migrate all source-backed examples to the shared vocabulary

**Files:**
- Modify: `apps/www/src/components/examples/week-view.tsx`
- Modify: `apps/www/src/components/examples/day-view.tsx`
- Modify: `apps/www/src/components/examples/multi-view.tsx`
- Modify: `apps/www/src/components/examples/calendar-ui.tsx`

**Interfaces:**
- Consumes: every component created in Task 1.
- Preserves: `SimpleWeekExample`, `WeekSlotsExample`, `DayViewExample`, and `MultiViewExample` registry exports.
- Produces: example files with zero presentation `className` attributes.

- [ ] **Step 1: Refactor the simple week and multi-view calendar grids**

Use `CalendarWeekdays`, `CalendarGrid`, `CalendarRow`, `CalendarCell`, and `CalendarEvent`. Keep view switching visible with the shared `Button`:

```tsx
<CalendarToolbar
  title={calendar.title()}
  previousLabel="Previous date range"
  nextLabel="Next date range"
  onPrevious={calendar.previous}
  onNext={calendar.next}
>
  {Object.keys(calendar.views).map((view) => (
    <Button key={view} active={calendar.view === view} onClick={() => calendar.setView(view)}>
      {view[0].toUpperCase() + view.slice(1)}
    </Button>
  ))}
</CalendarToolbar>
```

- [ ] **Step 2: Refactor day and timed-week rows**

Map projected slots into the shared timeline vocabulary while leaving the actual projection visible:

```tsx
<CalendarTimeline>
  {day.timeSlots.map((slot) => (
    <CalendarTimeRow key={slot.id} label={slot.time.toLocaleString('en-US', { timeStyle: 'short' })}>
      {slot.items.map((event) => <CalendarEvent key={event.id}>{event.title}</CalendarEvent>)}
    </CalendarTimeRow>
  ))}
</CalendarTimeline>
```

Render the timed week with the exact multi-column primitives from Task 1 while keeping slot/day iteration visible:

```tsx
<CalendarTimeGrid header={<CalendarWeekHeader days={week.days} />}>
  {timeSlots.map((slot, slotIndex) => (
    <CalendarTimeGridRow
      key={slot.id}
      label={slot.time.toLocaleString('en', { hour: 'numeric' })}
    >
      {week.days.map((day) => {
        const daySlot = day.timeSlots?.[slotIndex]
        return (
          <CalendarTimeCell key={day.id}>
            {daySlot?.items.map((event) => (
              <CalendarEvent key={event.id}>{event.title}</CalendarEvent>
            ))}
          </CalendarTimeCell>
        )
      })}
    </CalendarTimeGridRow>
  ))}
</CalendarTimeGrid>
```

- [ ] **Step 3: Remove presentation helpers and imports from the example modules**

Delete local loading wrappers, toolbars, weekday header markup, and all long Tailwind expressions now owned by `calendar-ui.tsx`. Keep `Suspense`, Calendar hooks, query code, and projection code.

- [ ] **Step 4: Verify source concision and exact registry exports**

Run:

```bash
pnpm --filter @gobrand/calendar-docs typecheck
rg -n "className=" \
  apps/www/src/components/examples/basic-month.tsx \
  apps/www/src/components/examples/week-view.tsx \
  apps/www/src/components/examples/day-view.tsx \
  apps/www/src/components/examples/multi-view.tsx
rg -n "export function (BasicMonthExample|SimpleWeekExample|WeekSlotsExample|DayViewExample|MultiViewExample)" apps/www/src/components/examples
```

Expected: typecheck PASS, no `className` matches in source-backed examples, and all five exports remain.

### Task 3: Make source disclosure layout-stable

**Files:**
- Modify: `apps/www/src/components/preview/index.tsx`

**Interfaces:**
- Preserves: `<CalendarPreview name="..." />` and registry lookup.
- Produces: a normal-flow source disclosure whose expansion changes height only.

- [ ] **Step 1: Record the current failure in browser acceptance**

At desktop width, record the bounding rectangles of the landing `h1`, the basic preview figure, and the section following the preview. Expand **View code** and record them again.

Expected before implementation: at least one preceding or neighboring rectangle changes because the preview shares a two-column hero row.

- [ ] **Step 2: Replace overlay-based controls with normal-flow disclosure**

Use one stable wrapper and a separate action row:

```tsx
<div className="min-w-0 border-t border-fd-border bg-fd-secondary/20">
  {expanded ? (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fd-border px-4 py-2">
        <span className="text-xs text-fd-muted-foreground">{example.title}.tsx</span>
        <div className="flex gap-2">
          <button type="button" onClick={copySource}>Copy</button>
          <button type="button" aria-expanded="true" onClick={() => setExpanded(false)}>Collapse</button>
        </div>
      </div>
      <div className="max-h-[32rem] min-w-0 overflow-auto">
        <DynamicCodeBlock code={source} lang="tsx" codeblock={{ allowCopy: false }} />
      </div>
    </>
  ) : (
    <button
      type="button"
      aria-expanded="false"
      onClick={() => setExpanded(true)}
      className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm"
    >
      View code
      <ChevronDown aria-hidden="true" className="size-4" />
    </button>
  )}
</div>
```

Apply the existing focus styles to all buttons. Remove the code excerpt, gradient overlay, absolute action group, and `useMemo` source preview.

- [ ] **Step 3: Verify TypeScript and lint**

Run: `pnpm lint && pnpm --filter @gobrand/calendar-docs typecheck`

Expected: both PASS with no unused imports.

### Task 4: Replace the landing page with the approved minimal stack

**Files:**
- Rewrite: `apps/www/src/components/landing/calendar-hero.tsx`
- Create: `apps/www/src/components/landing/calendar-benefits.tsx`
- Simplify: `apps/www/src/components/landing/dst-range-lab.tsx`
- Simplify: `apps/www/src/components/landing/learning-paths.tsx`
- Preserve with visual adjustment: `apps/www/src/components/landing/tiempo-callout.tsx`
- Rewrite composition: `apps/www/src/routes/index.tsx`
- Modify: `apps/www/src/styles/app.css`
- Delete: `apps/www/src/components/landing/calendar-problems.tsx`
- Delete: `apps/www/src/components/landing/calendar-architecture.tsx`

**Interfaces:**
- Consumes: `<CalendarPreview name="basic-month" />` and `<DstRangeLab />`.
- Produces: `CalendarHero`, `CalendarBenefits`, `LearningPaths`, and `TiempoCallout` in a single-column route composition.

- [ ] **Step 1: Rewrite the hero as title-first, preview-second**

The hero must render this hierarchy with no shared two-column grid:

```tsx
<section className="landing-hero">
  <div className="landing-intro">
    <p className="landing-kicker">Temporal-first calendar engine</p>
    <h1>Build calendars without timezone bugs.</h1>
    <p>Headless month, week, and day views with explicit timezone, range, and projection contracts.</p>
    <div className="landing-actions">
      <button type="button" onClick={copyInstall}>
        <code>pnpm add @gobrand/react-calendar @js-temporal/polyfill</code>
        <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <Link to="/docs/$" params={{ _splat: '' }}>Read the docs</Link>
    </div>
  </div>

  <div className="landing-demo-surface">
    <CalendarPreview name="basic-month" className="landing-demo" />
  </div>
</section>
```

Use `max-width: 56rem` for intro copy and `max-width: 72rem` for the demo. The preview is below the copy at every breakpoint.

- [ ] **Step 2: Replace the bug table and architecture tree with three concise benefits**

Create `CalendarBenefits` with these exact messages in simple bordered rows:

```ts
const benefits = [
  ['Timezone explicit', 'Today, visible ranges, and item projection share one timezone.'],
  ['Boundary safe', 'Half-open ranges prevent duplicated events between views.'],
  ['Data independent', 'Each projection keeps its own item type and query lifecycle.'],
] as const
```

Do not add icons, cards, gradients, numbering, or animation.

- [ ] **Step 3: Simplify the DST lab without removing its teaching behavior**

Keep the spring-forward, fall-back, and ordinary-day presets plus the 23h/25h result. Replace violet/green styling with neutral surfaces, sky start labels, cyan end labels, and one simple segmented range line. Keep long timestamps breakable on mobile.

- [ ] **Step 4: Simplify learning links and Tiempo placement**

Render the three learning links as ordinary bordered links rather than large cards. Keep the Tiempo sentence exactly once after the learning links and do not import Tiempo in any example.

- [ ] **Step 5: Restore the original palette and remove decorative CSS**

Replace the current landing CSS token set with:

```css
.calendar-landing {
  --landing-sky: #38bdf8;
  --landing-cyan: #22d3ee;
  color: #f5f5f5;
}

.landing-shell {
  width: min(100% - 2rem, 72rem);
  margin-inline: auto;
}

.landing-hero,
.landing-section {
  padding-block: clamp(3.5rem, 7vw, 6rem);
}

.landing-demo-surface {
  margin-top: 3rem;
  border-radius: 1.5rem;
  padding: clamp(0.75rem, 3vw, 2rem);
  background: linear-gradient(135deg, #0c4a6e 0%, #0e7490 50%, #06b6d4 100%);
}
```

Delete `.landing-grid`, the `.calendar-landing` background images, condensed display font, violet token, range gradient, and architecture-specific rules. The `main` element must inherit the Fumadocs background instead of setting `bg-[#071114]`.

- [ ] **Step 6: Verify source-level visual constraints**

Run:

```bash
rg -n "landing-grid|background-image|Avenir Next Condensed|landing-violet|#071114|calendar-problems|calendar-architecture" apps/www/src
rg -n "@gobrand/tiempo" apps/www/src/components/examples apps/www/content/docs/'(react)'/examples
pnpm lint
pnpm --filter @gobrand/calendar-docs typecheck
```

Expected: both scans return no matches and lint/typecheck PASS.

### Task 5: Production and browser acceptance

**Files:**
- Modify only files required by failures introduced in Tasks 1-4.

**Interfaces:**
- Verifies: exact source, responsive layout, stable expansion, interactions, generation, and downstream build contracts.

- [ ] **Step 1: Run repository and nested-demo gates**

Run:

```bash
pnpm lint
pnpm format:check
pnpm test --run
pnpm typecheck
pnpm build
pnpm verify:packages
pnpm --dir apps/demo typecheck
pnpm --dir apps/demo build
git diff --check
```

Expected: 154 Core tests, 6 React tests, every typecheck/build, packed-package verification, and diff check PASS. The existing non-fatal Wrangler `assets.serve_directly` warning may remain.

- [ ] **Step 2: Verify generated and source-backed artifacts**

Run:

```bash
pnpm generate:docs
rg -n "className=" apps/www/src/components/examples/{basic-month,week-view,day-view,multi-view}.tsx
rg -n "const code =" apps/www/src/components/examples
```

Expected: docs generation PASS and both scans return no matches.

- [ ] **Step 3: Verify desktop layout and expansion stability**

Start the docs server and use the in-app browser at `http://127.0.0.1:3000/calendar/`. At the default desktop viewport:

1. Record `getBoundingClientRect()` for the hero `h1` and `[data-example="basic-month"]` before expansion.
2. Expand **View code**.
3. Record the same rectangles again.
4. Assert `x`, `y`, and `width` are unchanged for both elements; only the preview height and following-section `y` may increase.
5. Collapse source and navigate to the next month.

Expected: no lateral shift, no compacted copy, source is concise and contains imports from `./calendar-ui`, and calendar navigation changes the title.

- [ ] **Step 4: Verify mobile and docs behavior**

At `390 × 844`:

1. Assert `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
2. Inspect the entire title and install row for clipping.
3. Expand/collapse the source and confirm controls remain visible without overlap.
4. Open `/calendar/docs/first-calendar` and repeat the overflow and expansion checks.
5. Switch the multi-view example from month to week.
6. Select DST spring-forward and fall-back and verify `23h` and `25h`.
7. Inspect console errors and warnings.

Expected: zero horizontal overflow, zero console errors, stable disclosure, correct view switching, and correct DST results.

- [ ] **Step 5: Preserve branch state for user integration choice**

Run `git status --short` in Calendar and the nested demo. Do not stage, commit, push, release, or deploy unless explicitly requested by the user.
