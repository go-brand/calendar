import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('package consumer uses pnpm 11 workspace overrides', () => {
  const source = readFileSync('scripts/verify-packages.ts', 'utf8');

  assert.doesNotMatch(source, /manifest\.pnpm/);
  assert.match(source, /pnpm-workspace\.yaml/);
  assert.match(source, /overrides:/);
  assert.match(source, /minimumReleaseAgeExclude:/);
});
