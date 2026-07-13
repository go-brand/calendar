import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test, { before } from 'node:test';

const siteUrl = 'https://calendar.gobrand.app';
const generatedFiles = [
  'apps/www/public/robots.txt',
  'apps/www/public/sitemap.xml',
  'apps/www/public/llms.txt',
  'apps/www/public/llms-full.txt',
  'apps/www/public/.well-known/agent-skills/index.json',
  'apps/www/public/.well-known/agent-skills/calendar/SKILL.md',
  'apps/www/src/generated/agent-markdown.ts',
  'skills/calendar/SKILL.md',
];

function generate(): void {
  execFileSync('pnpm', ['generate:docs'], { stdio: 'pipe' });
}

function text(file: string): string {
  return readFileSync(file, 'utf8');
}

before(generate);

test('generates crawler policy and canonical sitemap', () => {
  const robots = text('apps/www/public/robots.txt');
  const sitemap = text('apps/www/public/sitemap.xml');

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Content-Signal: ai-train=no, search=yes, ai-input=yes$/m);
  assert.match(robots, new RegExp(`^Sitemap: ${siteUrl}/sitemap\\.xml$`, 'm'));
  assert.match(robots, /^User-agent: GPTBot$/m);
  assert.match(robots, /^User-agent: Claude-Web$/m);
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, new RegExp(`<loc>${siteUrl}/docs</loc>`));
});

test('generates llms-full and links it from llms.txt', () => {
  const llms = text('apps/www/public/llms.txt');
  const full = text('apps/www/public/llms-full.txt');

  assert.match(llms, new RegExp(`\\[Complete documentation\\]\\(${siteUrl}/llms-full\\.txt\\)`));
  assert.match(full, /^# temporal-calendar/m);
  assert.match(full, new RegExp(`Canonical: ${siteUrl}/docs/first-calendar`));
});

test('publishes a valid Calendar skill discovery entry', () => {
  const index = JSON.parse(text('apps/www/public/.well-known/agent-skills/index.json')) as {
    $schema: string;
    skills: Array<{ name: string; type: string; url: string; digest: string }>;
  };
  const publishedSkill = text('apps/www/public/.well-known/agent-skills/calendar/SKILL.md');

  assert.equal(index.$schema, 'https://schemas.agentskills.io/discovery/0.2.0/schema.json');
  assert.equal(index.skills.length, 1);
  assert.equal(index.skills[0]?.name, 'calendar');
  assert.equal(index.skills[0]?.type, 'skill-md');
  assert.equal(index.skills[0]?.url, '/.well-known/agent-skills/calendar/SKILL.md');
  assert.match(index.skills[0]?.digest ?? '', /^sha256:[a-f0-9]{64}$/);
  assert.equal(publishedSkill, text('skills/calendar/SKILL.md'));
});

test('all generated Calendar URLs use the canonical hostname', () => {
  const urls = generatedFiles
    .flatMap((file) => text(file).match(/https:\/\/[^\s)"'<>]+/g) ?? [])
    .filter((url) => url.includes('calendar'));

  assert.ok(urls.length > 0);
  assert.deepEqual(
    urls.filter((url) => !url.startsWith(siteUrl)),
    [],
  );
});

test('generation is deterministic', () => {
  const beforeGeneration = new Map(generatedFiles.map((file) => [file, text(file)]));

  generate();

  for (const file of generatedFiles) {
    assert.equal(text(file), beforeGeneration.get(file), file);
  }
});
