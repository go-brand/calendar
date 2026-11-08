# Plan 006: Restore the verification workflow without reducing consumer coverage

- Status: IMPLEMENTED locally; actual GitHub Actions/Linux matrix pending; priority P1; effort S; risk medium; category tooling.
- Planned at `6d6decd`, 2026-10-08. Dependencies: none.
- Work from repository root. Suggested branch: `codex/restore-verification`. Match existing conventional commit style. Do not publish, push, or invoke `pnpm release` to test this plan.
- Drift check: `git diff --stat 6d6decd..HEAD -- package.json pnpm-workspace.yaml pnpm-lock.yaml .github/workflows/ci.yml scripts/release.sh scripts/generate-docs.test.ts README.md`. Compare changed files against the facts below before proceeding; expected predecessor changes are not automatic blockers.

## Outcome and boundaries

Contributors and CI can install and run the current checks; committed generated docs cannot silently drift. Keep the Node 20/22 package-test matrix, React peers, package engines, and published API unchanged. Toolchain requirements are not consumer runtime requirements.

Allowed files: root `package.json`, `pnpm-lock.yaml` if resolution actually changes, `.github/workflows/ci.yml`, `scripts/release.sh`, `README.md`, and a focused release-gate test under `scripts/` if needed. `pnpm-workspace.yaml` should remain unchanged unless a verified compatibility problem requires an explicit plan amendment. Do not upgrade application/library dependencies, migrate package managers broadly, change crawler policy, or alter runtime code.

## Current state and evidence

`package.json:26` pins `pnpm@11.12.0`; CI repeats `version: 11.12.0` in two setup steps. Registry metadata marks both this release and its `@pnpm/exe` distribution broken. `pnpm@11.13.1` was checked during the audit: it exists, has no deprecation field, and ordinary pnpm requires Node >=22.13. Recheck that metadata before use.

CI currently uses `pnpm/action-setup@v6`, then `actions/setup-node@v6`, with matrix `[20.x, 22.x]`. The existing action's [schema](https://raw.githubusercontent.com/pnpm/action-setup/v6/action.yml) supports `standalone: true`, installing `@pnpm/exe` with bundled Node. This is the smallest candidate to preserve the existing matrix. Its README now recommends successor `pnpm/setup` for pnpm 11+, so do not misrepresent the existing action as the currently recommended workflow. Actual execution remains a verification gate.

Root scripts include `build`, `typecheck`, `lint`, `format:check`, `test`, `test:docs`, `generate:docs`, and `verify:packages`. CI omits `test:docs`. The docs tests regenerate output before comparing two generations; that proves determinism, not freshness of committed output. Release checks cleanliness only before validation, then tests/typechecks/builds before mutating versions.

## Steps

1. Check `npm view pnpm@11.13.1 version deprecated engines --json` and the equivalent `@pnpm/exe` metadata. Use this fixed 11.x candidate only if still nondeprecated. Change the root pin; make CI consume that authoritative pin instead of duplicating a version. Set `standalone: true` in both existing pnpm setup steps. Keep the current Node matrix and explicit frozen install. A local ordinary pnpm install requires compatible Node; document the standalone alternative briefly.
   - Verify in each CI matrix job: selected `pnpm --version`; `node -p process.versions.node`; `pnpm exec node -p process.versions.node`. Both Node results must match the selected matrix major. Merely printing them is insufficient: add an assertion using the matrix value. This proves tests are not accidentally run under bundled pnpm's Node.
2. Run `pnpm install --frozen-lockfile`, then all commands in the table below. If the pin change genuinely requires lockfile refresh, run `pnpm install`, inspect the diff, then repeat frozen installation. Do not refresh unrelated resolutions. Existing source failures are findings to report, not license for a broad cleanup.
3. Add `pnpm test:docs` to CI. After generation/tests, check `git diff --exit-code -- apps/www/public apps/www/src/generated skills/calendar` so stale committed artifacts fail. Preserve the determinism test. Initially the gate checks freshness; it does not claim the existing documentation is semantically correct—that is plan 007.
4. In `scripts/release.sh`, run docs and packed-package verification after build and before reading/bumping versions. Add a second clean-tree check after all validation and before mutation. Follow the existing `git status -s` rejection pattern. Do not auto-stage generated files. Keep tagged CI as the authoritative validation of the bumped artifacts.
   - Verify `bash -n scripts/release.sh`. If exercising the script, use a temporary harness with stubbed `git`, `pnpm`, and version reads; a failed/dirty check must make version-write, commit, tag, and push stubs unreachable. Never execute the real release flow during verification.
5. Run the complete gates below on the candidate and preserve their output summary. Update this plan/index status only after the compatible matrix is actually green; local-only verification must be labeled as such.

## Commands and expected results

| Command | Expected |
| --- | --- |
| `pnpm install --frozen-lockfile` | Exit 0; no manifest/lock mismatch |
| `pnpm build` | Exit 0 for both packages and website |
| `pnpm typecheck` | Exit 0 |
| `pnpm lint` and `pnpm format:check` | Exit 0 |
| `pnpm test --run` | All package tests pass and terminate |
| `pnpm test:docs` | All documentation tests pass |
| `pnpm verify:packages` | Packed package verification passes |
| `git diff --exit-code -- apps/www/public apps/www/src/generated skills/calendar` | Exit 0 once intended generated changes are committed |

During an uncommitted docs change, inspect the expected generated diff rather than claiming the clean-generation gate passes. The CI gate is evaluated on the committed candidate.

## Done criteria and stop conditions

- Root and CI agree on one nondeprecated pin; both Node matrix jobs run full package tests under their intended runtime.
- Existing checks, added docs gate, and committed-generation gate pass. No consumer support is removed.
- Release validation cannot proceed into version mutation after creating an uncommitted generated diff.
- Only scoped files changed; no release/commit/tag/push side effect was triggered by verification.

Stop and revise the tooling choice if standalone setup cannot preserve script runtimes or frozen installation. A maintained pnpm 10 release is a credible alternative (10.26 already supports `allowBuilds`); do not automatically grow a multi-job/runtime-download framework. Stop if unrelated dependency upgrades or package engine changes seem necessary. Test any release-script logic through isolated stubs. Preserve existing user changes.

Maintenance: rerun version/engine checks when changing the pin. Keep generated-doc validation before release mutation and never silently replace full runtime test coverage with import-only smoke checks.
