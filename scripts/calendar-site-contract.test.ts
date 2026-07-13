import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const formerHost = ['eng', 'gobrand', 'app'].join('.');

function trackedFiles(): string[] {
  return execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter((file) => file && existsSync(file));
}

function text(file: string): string {
  return readFileSync(file, 'utf8');
}

test('tracked files do not reference the former shared hostname', () => {
  const matches = trackedFiles().filter((file) => text(file).includes(formerHost));

  assert.deepEqual(matches, []);
});

test('deployable website files do not use the former calendar base path', () => {
  const matches = trackedFiles()
    .filter((file) => file.startsWith('apps/www/'))
    .filter((file) => {
      const content = text(file);
      return (
        content.includes("'/calendar/") ||
        content.includes('"/calendar/') ||
        content.includes('localhost:3000/calendar/')
      );
    });

  assert.deepEqual(matches, []);
});

test('Wrangler uses only the Calendar custom domain', () => {
  const config = text('apps/www/wrangler.jsonc');
  const parsed = JSON.parse(config) as {
    assets: { run_worker_first: unknown };
  };

  assert.match(config, /"pattern"\s*:\s*"calendar\.gobrand\.app"/);
  assert.match(config, /"custom_domain"\s*:\s*true/);
  assert.match(config, /"compatibility_date"\s*:\s*"2026-01-20"/);
  assert.deepEqual(parsed.assets.run_worker_first, ['/', '/docs', '/docs/*', '/api/*']);
  assert.doesNotMatch(config, /"serve_directly"/);
  assert.doesNotMatch(config, /"zone_name"/);
});
