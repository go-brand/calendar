# Public calendar laws and optional learning evaluation

## Property coverage inventory

Baseline: `5849b80`; planned baseline: `6d6decd`. Predecessor differences cover controller registration, React replacement/Strict Mode/concurrent state, module boundaries, peer dependencies and packaged examples. Those tests remain intact; this work adds no React or consumer duplicates.

| Legacy property group | Current API applicability | Decision |
| --- | --- | --- |
| buildMonth shape (seven laws) | Complete weeks, bounded grid, configured weekday, contiguity, month membership/count and endpoints still apply | Adapt existing laws to public `createCalendar`/`buildMonthView` |
| buildMonth data binding | Supplied dates determine assignment | Adapt existing law; add frozen independently shaped records, repeated dates and guaranteed outside-grid record |
| buildWeek shape (three laws) | Seven contiguous dates containing reference date with configured start still apply | Adapt existing laws to public `buildWeekView` |
| buildDay geometry (two laws) | Positive intraday slots still apply; legacy numeric hours/options do not describe current API | Replace with stronger public day/week minute geometry, clipped tail and exclusive boundary law |
| Shared dateRange (three laws) | Half-open calendar-day boundaries and timezone ownership still apply | Keep; switch agreement assertion to public week |

No runtime modules or dependencies are removed. Existing legacy example tests remain; any further cleanup is a separate change after review. New controller laws connect all rendered views to visibleRange and explicitly cover New York's 23- and 25-hour days. The bounded year generator includes 1971–2100; explicit February cases guarantee 2000/2024 leap and 2100 non-leap century coverage for all seven week starts.

Deferred findings: >24-hour/calendar-unit slot durations and the default final nanosecond boundary remain outside these laws pending their contract patch. Time placement uses the supplied local `getStart` time; the data layer owns timezone conversion. No stable React identity or multi-day slot policy is asserted.

## Fixed evaluation protocol

Execution status: **not executed**. No model calls, scores, costs, or ranking claims. Proposed diagnostic sample: three attempts per task per condition (15 attempts each, 30 total), only with an operator-selected existing model and budget. Actual sample size: 0. Package: `@gobrand/calendar-core` 0.1.5; candidate docs baseline commit: `5849b80` (record the actual docs commit at execution). Model identifier/version: unset. Comparison conditions must identify their exact docs commits, especially before/after plan 007.

Keep a supplied TypeScript/React application shell, dependencies, query provider, Vitest behavioral harness, model/version, tools, retrieval policy and attempt budget identical between conditions. Reset workspaces per attempt. Permit the repository README and package README as initial documentation entrypoints, then only documented linked local guides/llms.txt/llms-full.txt and public declarations; record every retrieved document. Prompts below prohibit unrelated styling or framework changes. Oracles use exported APIs and Temporal primitives; rerun existing public laws as ordinary tests for all variants. No model score becomes a release gate.

### 1. Arbitrary-record month calendar

Prompt: “In the supplied shell, render a month calendar for records `{ ticket: string, scheduledFor: Temporal.PlainDate }`. Infer the item type. Display tickets on supplied dates and wire next/previous month buttons. Use the published calendar APIs; keep the shell unchanged.”

Oracle: compilation infers item type without `any` or fake wrappers; the rendered grid has complete seven-day weeks, configured weekday and each month date exactly once; two button actions update controller date and rendered month; duplicate-date records retain their identity and appear once each; outside-grid records do not appear. Held-out: `{ reference: number, due: Temporal.PlainDate }`, Sunday week start. Reuse the public month/data laws plus shell click assertions.

### 2. Data-free date picker

Prompt: “Implement a date picker in the supplied shell with no event data. Add month navigation and return the clicked Temporal.PlainDate to the supplied selection callback.”

Oracle: no fabricated item type, array or accessor; next then previous work; clicking a named date returns an equal PlainDate exactly once; selection display matches; month grid remains valid. Held-out: Tuesday week start, leap February, adjacent-month cell click. Use public data-free/grid laws plus callback assertions.

### 3. Typed multi-view calendar

Prompt: “Configure only month and week in the supplied shell. Month receives `{ label, date }`; week receives `{ bookingId, startsAt }`. Render both data shapes with correctly narrowed view selection and wire view controls. Preserve independent data types.”

Oracle: TypeScript accepts configured names, rejects day via a held-out `@ts-expect-error` fixture, and narrows active view; month/weekly projections retain original records independently; view controls change visibleRange and rendered dates; no nonexistent API imports. Held-out: month/day instead, renamed fields and Thursday week start. Use existing type fixtures and public independent-record/range laws; add shell view-control assertions when executing.

### 4. UTC-backed local-date calendar/query

Prompt: “Display UTC timestamp records in America/New_York in the supplied calendar. Explicitly map both getDate and getStart through that display zone. Query records using visibleRange with an inclusive start and exclusive end across the 2026 spring DST transition.”

Oracle: mapping uses one explicit zone in both accessors; `2026-03-08T04:30Z` lands March 7 at 23:30 locally; timestamps exactly at query start are included, exactly at end excluded; March 8 boundaries span 23 elapsed hours while covering one local date. Held-out: fall transition (25 hours), another local-midnight crossing and record field rename. Use public range/DST laws plus deterministic timestamp/filter assertions; never use Date or assume 24 elapsed hours.

### 5. Suspense composition

Prompt: “In the supplied React/query shell, keep the calendar controller and navigation controls mounted and usable while view records suspend. Render a fallback for the view and map loaded records after resolution. Preserve the required query provider/bootstrap.”

Oracle: unresolved deferred query shows view fallback while controls remain mounted; navigation updates controller/range before resolution; resolving current query displays correctly dated records and does not reset navigation; query provider is present and no missing bootstrap/import errors occur. Held-out: switch views while loading and records crossing local midnight. Reuse existing packaged Suspense/navigation regression plus deferred-promise shell assertions. Do not demand stable hook-object identity.

## Per-attempt result record

Record condition; package versions; exact docs commit; model identifier/version; task and held-out variant; complete prompt; fixed shell/harness revision; initial context; allowed tools; retrieval policy; retrieved document list and token/document volume where available; first-attempt compilation command/result; behavioral commands/results; nonexistent imports; correction turns and total attempt budget; final outcome; reproducible failure seed/path where relevant. Mark unavailable telemetry as unavailable rather than estimating it.

After actual runs, report both raw numerator/denominator and observed variation per condition. A failure must lead to a specific docs/API hypothesis (for example, missing explicit timezone-mapping guidance). Repeat under the fixed protocol before attributing an improvement. This small diagnostic cannot establish statistically reliable model recommendation rank. The experiment remains pending until real runs are recorded.
