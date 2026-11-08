# Plan 007: Make agent-facing documentation truthful and examples usable

- Status DONE; priority P1; effort M; risk medium; category docs/DX.
- Planned at `6d6decd`, 2026-10-08. Depends on plan 006 for working verification.
- Suggested branch `codex/trustworthy-agent-docs`; conventional commits. No deployment or package release.
- Drift check: `git diff --stat 6d6decd..HEAD -- apps/www/content/docs apps/www/src/components/examples apps/www/src/lib/cn.ts scripts/generate-docs.ts scripts/generate-docs.test.ts scripts/verify-packages.ts fixtures/package-consumer skills/calendar README.md packages/core/README.md packages/react/README.md CLAUDE.md`. Reconcile plan 006's expected tooling changes; compare all other changes with the evidence below.

## Outcome

An agent can obtain actual supported APIs and functional example source from Markdown, without browser-only preview interaction or guessing missing application helpers. Published source and compiled source are identical. Keep the five core value exports, headless scope, arbitrary item types, and explicit Temporal mappings.

Allowed files: the paths above; a small data-only example manifest and example bootstrap/support files under `apps/www/src/components/examples/`; focused docs verification modules/tests under `scripts/`; generated `apps/www/public/`, `apps/www/src/generated/agent-markdown.ts`, and `skills/calendar/SKILL.md`. Package-consumer fixture dependencies may expand only for actual published example requirements and the explicitly separate dedicated consumer test harness. Do not modify the user's untracked `AGENTS.md`, runtime packages, public API, website design, crawler policy, or add a documentation framework.

## Current state

- `packages/core/src/index.ts` exports `createCalendar`, `buildMonthView`, `buildWeekView`, `buildDayView`, and `getWeekdays` as values. `apps/www/content/docs/core/utilities.mdx:40` begins instructions importing 16 absent values. These include formatting, conversion, navigation, range, and layout helpers. Do not resurrect them.
- `scripts/generate-docs.ts:406` appends raw MDX `doc.body`. `llms-full.txt` has nine unresolved `CalendarPreview` elements. `apps/www/src/components/examples/registry.tsx` maps seven names to six entry files via Vite `?raw` imports.
- Examples require `calendar-ui.tsx` and `mock-data.ts`. `calendar-ui` imports `@/lib/cn`, which uses `tailwind-merge`. `suspense-month.tsx` assumes `QueryClientProvider` installed by the website root. Plain TSX entry source is therefore not a complete standalone example.
- The skill generator labels all doc pages as functions and guesses `()` from titles at lines 312–324.
- The packed consumer compiles three copied fixture files; generator tests check URLs/structure/determinism. Neither validates all source actually published to readers.
- `TODO.md:31` explicitly places UTC conversion in the data layer. The v1 design preserves per-render React controllers, inferred types, and simple-to-advanced disclosure.

## Steps and verification

1. Correct `core/utilities.mdx`: retain `getWeekdays`; replace useful obsolete recipes with direct Temporal operations or existing controller/projection operations. Remove unsupported layout claims. Preserve helpful section anchors with short explanations if necessary. Update the skill's table to linked documentation topics rather than invented callable names.
   - Verify all package value imports on that page exist in packed exports. Add a test that a nonexistent documented import fails verification. Distinguish type-only exports; do not compare every type import with runtime keys.
2. Add concise contracts to the current timezone and controlled-state pages and generated skill input. Explain controller timezone versus accessor-owned event mapping, with a UTC event crossing midnight after conversion. Both accessors must derive from the same normalized value. Explain that controller/action identity can change and subscriptions use `[calendar]`. Keep the simple quick start short; link to these details.
   - Verify the timezone recipe in a checked fixture with a known date-crossing result. Do not make claims about repaired external-controller behavior until plan 008 passes. Reconcile stale file paths in `CLAUDE.md` without changing its intended simplicity rules or changing existing public signatures into positional parameters.
3. Introduce a finite data-only manifest of preview name, entry path/export, support files, external dependencies, and optional bootstrap. Keep React component registration separate and test identical name coverage. Use explicit file reads—no executing MDX, AST rewriting, import crawler, or bundler imports in the generator.
   - Verify every existing preview name resolves and a deliberately unknown name fails generation with a useful error. Keep generated URLs canonical and output deterministic.
4. Publish each example's code and complete functional source set to Markdown or linked generated Markdown source bundles. Resolve website-only aliases with ordinary relative source organization, not generated string replacement. Include required helpers; label styling as optional unless its actual setup is supplied. Provide a tiny stable-QueryClient bootstrap for the standalone Suspense bundle. Keep it outside the calendar package.
   - Verify no unresolved `CalendarPreview` marker remains in negotiated/full agent Markdown. Per-example source must be reachable without browser interaction. Deduplicate shared support files in the full corpus. The short skill/index should link to focused examples rather than embedding every helper.
5. Feed the exact manifest files into the existing packed-consumer verifier. Copy them into its temporary fixture preserving relative paths; install declared example dependencies and tarballs. Remove reliance on website aliases/workspace source. The current consumer tsconfig includes only three named files: create `fixtures/package-consumer/tsconfig.examples.json` that includes every copied manifest entry/bootstrap/support source. Run that compiler explicitly and assert its `--listFilesOnly` output contains every manifest source expected to compile. Copying files or comparing bytes without this check is insufficient.
   - Create a finite snippet inventory covering every TypeScript/TSX fence in the root/package READMEs, current MDX docs, and generated skill quick start. Classify each as a complete checked example, a checked negative API example, or a contextual excerpt with its named checked harness. At minimum, the three README quick starts, skill quick start, first-calendar, controlled-state, data-and-suspense, timezone/date-crossing, and core create/projection/range recipes must have checked source or harnesses. The seven preview names use the source manifest. Do not leave the term “principal examples” to executor selection. Standalone sources/harnesses must include the exact published snippet bytes rather than an independently maintained equivalent.
   - Verify standalone compilation; an absent helper, absent export, or invalid configured view must fail the relevant check. Preserve all existing `@ts-expect-error` negative tests; do not use `@ts-ignore` or blanket exclusions. Scope the published verification claim to this explicit inventory.
6. Add `fixtures/package-consumer/examples.runtime.test.tsx` and `fixtures/package-consumer/vitest.runtime.config.ts`, invoked explicitly by `scripts/verify-packages.ts` inside the temporary installed consumer. Install matched React/React DOM plus test-only Vitest, jsdom, and Testing Library dependencies separately from the manifest's published-example dependencies. The current verifier overwrites `manifest.dependencies`; extend that construction deliberately so declared example/test dependencies are actually installed. Runtime tests import the copied examples and installed tarballs, never website/workspace source or the compile-only negative fixture.
   - Check navigation/selection; Suspense fallback followed by events; usable controls; and no missing QueryClient provider. Do not reuse the repository's React Vitest config unchanged because its relative setup file belongs to that package. Reuse its test patterns in the dedicated consumer config. Compilation alone cannot prove these behaviors.
7. Regenerate docs and run `pnpm test:docs`, `pnpm build`, `pnpm typecheck`, `pnpm verify:packages`, `pnpm lint`, `pnpm format:check`, and `pnpm test --run`. All must exit 0. On the committed candidate, plan 006's generated-drift check must pass.

## Regression-test structure

Use `scripts/generate-docs.test.ts` for generator outcomes and the existing consumer fixtures for emitted-type contracts. Add source-manifest tests that compare published bytes with the compiled bytes, not separately copied examples. A controlled typo of a documented package import must fail; restoring it must pass. A controlled missing support file/unknown preview must fail. Do not require every illustrative prose fragment to be standalone; label and check its harness explicitly.

## Done criteria

- No nonexistent APIs are advertised as exports in the utility page, skill, full Markdown, or negotiated Markdown.
- All seven registered preview names resolve to published source with their functional dependencies; there are zero unresolved preview tags in agent output.
- Principal examples compile against packed packages without website aliases; negative API tests still enforce their intended errors.
- Standalone Suspense bootstrap mounts and resolves; navigation/selection checks pass.
- Controller/action lifetime and data-layer timezone ownership are explicit without new APIs.
- All verification commands pass; the committed generated artifacts match canonical source.

## Stop conditions and maintenance

Stop if a proposed docs fix requires new calendar exports, silent event conversion, a provider requirement for simple mode, or styling/runtime framework expansion. Stop if the compiler harness can pass while compiling different bytes from those published. Revise a source bundle if it depends on hidden website context; do not call it standalone until the context is included.

Future examples must be registered once and verified against tarballs. “Compiles” and “functional integration example” do not imply production accessibility, identical website appearance, SSR correctness, or complete keyboard interaction support. Those require separate evidence.
