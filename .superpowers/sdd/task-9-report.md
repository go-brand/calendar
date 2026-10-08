# Task 009 report

Status: DONE. Baseline 6217c28. No version bump, publication, runtime changes, dependency policy changes, or lockfile edits.

## Implementation

Both package export maps now pair import/index.js with index.d.ts and require/index.cjs with index.d.cts. Existing top-level types, main, and module fields remain unchanged. Existing emitted declarations were sound; no build configuration edits were needed.

Added small explicit .cts/.mts consumers with positive controller/projection/hook usages and negative configured-view/invalid-view assertions. Node16 checks the CommonJS consumer; NodeNext checks both formats. Both configurations use skipLibCheck:false. Packed verification preserves TypeScript 5.7.3 baseline and separately installs an aliased TypeScript 5.9.3 compiler for the reproduced boundary. Both compilers run both module configurations; the existing bundler fixtures and exact source/snippet compilation remain intact.

Both import and require load BOTH installed packages and assert actual July projection month, item placement on July 10, and August projection after navigation. Focused React boundary smoke compiles and renders each matched React/react-dom/@types pair (19 and 18), checks next/previous updates, and explicitly asserts one resolved React instance across wrapper, renderer, and testing library. React 18 has its own clean temporary consumer containing only the targeted peer fixture/configuration; existing React 19 example harness stays unchanged.

Client directive, packed test-declaration exclusion, public utility export checks, exact manifest/snippet/source verification, compiler source inclusion, and deliberate documentation failure probes are preserved.

## TDD evidence

RED: after adding the .cts consumer and targeted compiler invocation, ran `pnpm build` (exit 0), then `pnpm verify:packages` (exit 1) before either export map was edited. First iteration additionally identified string dates in the new fixture; corrected those to Temporal.PlainDate and reran to establish clean RED. The recorded task9-red.log contains ONLY these compiler failures:

- module-boundary.cts(2,48): TS1479, CommonJS consumer cannot import ESM declaration from @gobrand/calendar-core.
- module-boundary.cts(3,74): TS1479, CommonJS consumer cannot import ESM declaration from @gobrand/react-calendar.

The packages were freshly packed and installed successfully; failure was at the reproduced Node16 module boundary, not dependencies/artifacts.

GREEN: after nesting matching declaration conditions, `pnpm verify:packages` exited 0. Final fresh `pnpm build` and `pnpm verify:packages` also exited 0 after adding baseline module checks and positive/negative hook typing assertions. Final green log records retained 10 example runtime tests plus one targeted React 19 and one targeted React 18 navigation test and `Packed package verification passed`.

## Final validation

All commands ran from the explicit isolated worktree /Users/rubencostamartinez/.codex/worktrees/calendar-reliability/temporal-calendar.

- `pnpm build`: exit 0 (final fresh artifact build).
- `pnpm typecheck`: exit 0 (core, React, website).
- `pnpm test --run`: exit 0; 156 core + 27 React = 183 tests.
- `pnpm lint`: exit 0; zero warnings/errors (rerun after final verifier changes).
- `pnpm format:check`: exit 0 (rerun after final verifier changes).
- `pnpm test:docs`: exit 0; 25 tests (rerun after final verifier changes).
- `pnpm verify:packages`: exit 0; bundler baseline, Node16 CJS and NodeNext ESM/CJS with TS5.7.3 and TS5.9.3; four runtime package/format projection checks; retained examples; isolated React18/19 boundary tests.
- `npm exec --yes --package=@pnpm/exe@11.13.1 --package=node@20 -- sh -c 'node --version; pnpm exec node --version; pnpm verify:packages'`: exit 0, both runtime probes 20.20.2.
- Same command with node@22: exit 0, both runtime probes 22.23.3.
- `git diff --check`: exit 0.

Maintained Node20/22 runs execute the complete packed verification only; full unit/build/type/lint/docs gates were run on host Node25.6.1. CI already invokes packed verification within its Node20/22 jobs. No enlarged peer/compiler/resolver matrix was added.

Logs are retained in .superpowers/sdd/task-9-logs/ (local ignored evidence). The host tsx runtime emits Node25 DEP0205 module.register deprecation; Node20/22 packed verification has no such deprecation. Package install output includes available-version notices; no compile/test warnings or failures.

## Files changed and self-review

Changed both package manifests and scripts/verify-packages.ts. Added module-boundary.cts, module-boundary.mts, tsconfig.node16.json, tsconfig.nodenext.json, react-peer.test.tsx, tsconfig.peer.json, vitest.peer.config.ts under fixtures/package-consumer.

Reviewed export order, compiler modes, invalid API assertions, installed-tarball imports, isolated peer manifests, exact-source checks, temporary cleanup, and the diff. Public signatures and legacy fields are unchanged; no hand edits to dist. No unresolved correctness concerns. User-owned untracked AGENTS.md is preserved.

## Review correction: explicit compiler selection

The original baseline coverage claim above was invalid: installing the TypeScript 5.9.3 alias alongside TypeScript 5.7 allowed pnpm's shared `tsc` executable to select the alias. Corrected every baseline invocation to `node node_modules/typescript/bin/tsc`, including Node16/NodeNext/bundler compilation, exact examples/snippets, `--listFilesOnly`, deliberate failure probes, restored-source compilation, and React 18/19 peer compilation. Targeted boundary checks use `node node_modules/typescript-targeted/bin/tsc`. Both temporary consumer manifests now pin the baseline to 5.7.3, and runtime version assertions fail on any unexpected compiler version and print evidence of the selected compiler.

Validation after correction:

- `npm exec --yes --package=@pnpm/exe@11.13.1 --package=node@22 -- sh -c 'node --version; pnpm exec node --version; pnpm verify:packages'`: exit 0; both Node probes report v22.23.3. Log explicitly records baseline `Version 5.7.3`, targeted `Version 5.9.3`, and baseline `Version 5.7.3` again for BOTH peer consumers. Retained examples: 10 tests pass; React 19 and React 18: one boundary navigation test each passes; final `Packed package verification passed`.
- `pnpm test:docs`: exit 0; all 25 tests pass, including verifier and release-gate checks.
- `pnpm lint`, `pnpm format:check`, and `git diff --check`: exit 0. Formatting was corrected before the final checks.

Logs: `.superpowers/sdd/task-9-logs/compiler-selection-{node22,docs,lint,format}.log` (ignored local evidence). Host docs execution retains the previously documented Node module.register deprecation warning; maintained Node 22 packed verification passes. No runtime source, package policy, lockfile, public API, release version, or user-owned AGENTS.md changes.
