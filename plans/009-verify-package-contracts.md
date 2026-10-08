# Plan 009: Match emitted declarations to the supported module entrypoints

- Status DONE; priority P2; effort S/M; risk low-medium; category distribution/types.
- Planned at `6d6decd`, 2026-10-08. Depends on plan 006. Reconcile plan 007's expected verifier/fixture changes if already landed.
- Suggested branch `codex/package-contracts`; conventional commits. No version bump or publication.
- Drift check: `git diff --stat 6d6decd..HEAD -- packages/core/package.json packages/react/package.json packages/react/tsup.config.ts scripts/verify-packages.ts scripts/verify-packages.test.ts fixtures/package-consumer`. Preserve canonical example verification introduced by other plans.

## Desired result and scope

Preserve the existing ESM and CommonJS contract and React 18/19 support. Correct type resolution without changing public APIs or asking consumers to change compiler mode. Avoid a full React × TypeScript × resolver × Node test matrix.

Allowed files: both package manifests, `scripts/verify-packages.ts`, its tests, consumer fixtures (additional explicit module fixtures/configurations allowed), and lockfile only if a real dependency change requires it. A consumer smoke harness may use temporary declared testing dependencies. The build configs may be inspected; change them only if emitted artifacts prove defective. No runtime/calendar refactor, CJS removal, new package engines, or blanket dependency upgrades.

## Current evidence

Both manifests contain:

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  }
}
```

Both builds emit `index.d.cts`, but the unconditional `types` branch selects ESM declarations for require consumers. A `.cts` fixture importing either package produces TS1479 with TypeScript 5.9.3, `module: Node16`, and `moduleResolution: Node16`. The same fixture passes under that compiler's NodeNext mode, and runtime require works on the tested Node 26. This is a narrow declaration bug, not evidence that all CommonJS execution fails.

The existing verifier packs both packages into a temporary consumer, compiles TypeScript 5.7 under bundler resolution, imports React ESM, and requires core CJS. It checks the React client directive and absence of test declarations. The v1 design explicitly requires dual module formats; React's manifest and README promise React 18/19.

## Steps and checks

1. Add a `.cts` consumer importing core and React APIs, plus an explicit Node16 tsconfig. Keep positive usages next to existing negative type assertions. Extend packed verification to run that compiler target before editing exports.
   - After `pnpm build`, run `pnpm verify:packages`: it must fail at the new CommonJS declaration fixture for the known resolution problem, not because a fixture dependency or tarball is missing.
2. Nest declarations under their matching conditions in BOTH manifests:

```json
"exports": {
  ".": {
    "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
  }
}
```

Retain existing top-level `types`, `main`, and `module` fields for legacy tooling; no evidence requires changing them. Do not hardcode declaration text or hand-edit `dist`. See [TypeScript's module/declaration model](https://www.typescriptlang.org/docs/handbook/modules/theory.html).
   - Verify the new CJS fixture now compiles and the previous bundler consumer still passes using freshly packed artifacts.
3. Add ESM/NodeNext and NodeNext-CJS fixture checks. Keep the existing TypeScript 5.7 baseline and cover the specifically reproduced 5.9.3 case with a targeted extra compiler run, not a many-version sweep. Prefer `skipLibCheck: false` for the small module-boundary fixture when possible; do not introduce suppression to hide a declaration incompatibility.
4. Exercise both `import` and `require` for BOTH packages in the installed consumer. Assert an actual core controller/projection result in each runtime format, not only exported function existence. Retain client-directive and packed-content checks.
5. Add a focused React 18 consumer compile/render smoke and retain React 19 coverage. Give it a dedicated runtime fixture/config invoked by `verify:packages`; reuse plan 007's dedicated consumer harness if it has landed. Do not execute `fixtures/package-consumer/index.tsx`: it intentionally contains invalid compile-only calls and a top-level hook. Do not reuse `packages/react/vitest.config.ts` unchanged because its relative setup file belongs to that package. The smoke should navigate a simple calendar through two updates using matched `react`/`react-dom` and type-package versions and one React instance. Use isolated temporary consumers or sequential clean installs so peer versions cannot contaminate each other. Limit the React 18 case to the advertised integration boundary; do not multiply all resolver/compiler cases by both React versions.
   - Verify both peer cases compile, mount, and navigate. A missing/duplicate React peer or type package must fail explicitly.
6. Run all final commands below. Preserve any source-manifest examples and docs checks added by plan 007; they are complementary to module resolution checks.

## Commands and done criteria

- `pnpm build`, `pnpm typecheck`, `pnpm test --run`, `pnpm lint`, `pnpm format:check`, `pnpm test:docs`, and `pnpm verify:packages` all exit 0.
- Packed consumers pass bundler, Node16 CJS, and NodeNext module checks; invalid API examples still produce their intended compiler errors.
- Both runtime formats load both packages and produce expected core results under the maintained Node consumer matrix.
- React 18/19 targeted smoke tests pass. The React client directive remains and tarballs contain no test declarations.
- Public exports/signatures and consumer engine policy are unchanged. Root release validation runs packed verification before version mutation as established by plan 006.

## Stop conditions and maintenance

Stop if a pass requires asking consumers to use NodeNext, removing CommonJS, weakening types, suppressing TS1479, or importing workspace source instead of the installed tarball. Diagnose any dual React installation rather than changing peer policy. Do not add a broad compatibility framework or network checks after local release tagging.

Future export changes must keep each JS format paired with its declaration format. Package-consumer fixtures, not source-only unit tests, enforce this promise. Test tagged artifacts in CI before publishing; pre-bump local verification alone does not prove the bumped package metadata.
