import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const releaseScript = resolve('scripts/release.sh');

function runRelease({ dirty = false, failure = '' } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'calendar-release-gate-'));
  const bin = join(directory, 'bin');
  mkdirSync(bin);
  const log = join(directory, 'calls');
  writeFileSync(log, '');
  const stub = `#!/bin/bash
printf '%s %s\\n' "$(basename "$0")" "$*" >> "$CALL_LOG"
case "$(basename "$0")" in
  git)
    if [[ "$*" == 'status -s' && -f "$HARNESS/dirty" ]]; then echo ' M generated.md'; fi
    if [[ "$*" == 'branch --show-current' ]]; then echo 'test-branch'; fi
    ;;
  pnpm)
    if [[ "$*" == "$FAILURE" ]]; then exit 1; fi
    if [[ "$*" == 'test:docs' && "$DIRTY" == 'true' ]]; then touch "$HARNESS/dirty"; fi
    ;;
  node) echo '1.0.0' ;;
esac
`;
  for (const command of ['git', 'pnpm', 'node']) {
    writeFileSync(join(bin, command), stub, { mode: 0o755 });
  }
  try {
    const result = spawnSync('bash', [releaseScript, 'patch'], {
      cwd: directory,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CALL_LOG: log, HARNESS: directory, DIRTY: String(dirty), FAILURE: failure },
      encoding: 'utf8',
    });
    return { ...result, calls: readFileSync(log, 'utf8') };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function assertNoMutation(calls) {
  assert.doesNotMatch(calls, /^node |^git (add|commit|tag|push) /m);
}

test('generated changes stop release before version reads or mutations', () => {
  const result = runRelease({ dirty: true });
  assert.equal(result.status, 1);
  assert.match(result.calls, /^pnpm test:docs$/m);
  assert.match(result.calls, /^pnpm verify:packages$/m);
  assertNoMutation(result.calls);
});

for (const failure of ['test:docs', 'verify:packages']) {
  test(`${failure} failure stops release before version reads or mutations`, () => {
    const result = runRelease({ failure });
    assert.equal(result.status, 1);
    assertNoMutation(result.calls);
  });
}

test('clean validation completes before version mutation', () => {
  const result = runRelease();
  assert.equal(result.status, 0);
  assert.match(result.calls, /pnpm build\npnpm test:docs\npnpm verify:packages\ngit status -s\nnode -p/);
});
