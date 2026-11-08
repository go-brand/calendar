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

import { snippetInventory, snippetSource, validateInventory } from './documented-snippets';

test('every published TypeScript fence has an explicit exact-byte harness', () => {
  validateInventory();
  for (const snippet of snippetInventory) {
    const { bytes, source } = snippetSource(snippet);
    assert.ok(source.includes(bytes), `${snippet.file}#${snippet.fence}`);
    assert.ok(['complete', 'contextual'].includes(snippet.classification));
  }
  assert.equal(snippetInventory.filter((snippet) => snippet.file.endsWith('README.md')).length, 3);
});

test('unclassified or duplicate published snippets fail the inventory check', () => {
  assert.throws(() => validateInventory(snippetInventory.slice(1)), /inventory differs/);
  assert.throws(
    () => validateInventory([...snippetInventory, snippetInventory[0]]),
    /inventory differs/,
  );
});
