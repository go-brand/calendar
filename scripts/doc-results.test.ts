import assert from 'node:assert/strict';
import test from 'node:test';
import { instrument, resultBlocks, runResultBlocks } from './doc-results';

test('instrument turns result comments into checks and leaves statements alone', () => {
  const code = [
    "const days = getWeekdays(7, 'en-US');",
    "days[0]; // 'Sun'",
    'days; // ["Sun", "Mon"]',
    'range.start.toString(); // "2026-06-29T00:00:00+02:00[Europe/Madrid]"',
  ].join('\n');
  const lines = instrument(code).split('\n');

  assert.equal(lines[0], code.split('\n')[0]);
  assert.match(lines[1], /__check\(.*, "Sun"\);$/);
  assert.match(lines[2], /__check\(.*"\[\\"Sun\\", \\"Mon\\"\]"\)/);
  assert.match(lines[3], /"2026-06-29T00:00:00\+02:00\[Europe\/Madrid\]"\)/);
});

test('documented results match what calendar-core returns', () => {
  assert.ok(resultBlocks().length > 0);
  const checks = runResultBlocks();
  assert.ok(checks.length > 0);
  for (const check of checks) {
    assert.equal(check.actual, check.expected, `${check.file}: ${check.line}`);
  }
});
