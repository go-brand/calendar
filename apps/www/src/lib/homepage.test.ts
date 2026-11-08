import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  AGENT_PROMPT,
  HOME_PAGE_META,
  HOME_PAGE_STRUCTURED_DATA,
  INSTALL_COMMAND,
} from './homepage';

test('agent prompt gives coding agents the complete Calendar contract', () => {
  assert.match(AGENT_PROMPT, /@gobrand\/react-calendar/);
  assert.match(AGENT_PROMPT, /@gobrand\/calendar-core/);
  assert.match(AGENT_PROMPT, /https:\/\/calendar\.gobrand\.app\/llms\.txt/);
  assert.match(AGENT_PROMPT, /npx skills add go-brand\/calendar/);
  assert.match(AGENT_PROMPT, /half-open/);
  assert.match(AGENT_PROMPT, /DST/);
  assert.match(AGENT_PROMPT, new RegExp(INSTALL_COMMAND.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('homepage metadata names the product, canonical URL, and agent resources', () => {
  assert.equal(HOME_PAGE_META.canonicalUrl, 'https://calendar.gobrand.app/');
  assert.match(HOME_PAGE_META.title, /Calendar/);
  assert.match(HOME_PAGE_META.title, /Temporal/);
  assert.match(HOME_PAGE_META.description, /llms\.txt/);
  assert.match(HOME_PAGE_META.description, /Agent Skill/);
});

test('structured data describes the website and both published packages', () => {
  assert.equal(HOME_PAGE_STRUCTURED_DATA['@context'], 'https://schema.org');
  assert.deepEqual(
    HOME_PAGE_STRUCTURED_DATA['@graph'].map((entry) => entry['@type']),
    ['WebSite', 'SoftwareSourceCode'],
  );

  const source = HOME_PAGE_STRUCTURED_DATA['@graph'][1];
  assert.equal(source?.codeRepository, 'https://github.com/go-brand/calendar');
  assert.deepEqual(
    source?.targetProduct.map((product) => product.name),
    ['@gobrand/calendar-core', '@gobrand/react-calendar'],
  );
});

test('hero source keeps agent prompt, package install, and docs in that order', () => {
  const source = readFileSync('apps/www/src/components/landing/calendar-hero.tsx', 'utf8');
  const agent = source.indexOf('Copy prompt for your agent');
  const install = source.indexOf('Copy package command');
  const docs = source.indexOf('Read the docs');

  assert.ok(agent >= 0, 'agent prompt action is missing');
  assert.ok(install > agent, 'package install must follow the agent prompt');
  assert.ok(docs > install, 'docs must follow package install');
});

test('negotiated homepage Markdown exposes agent discovery and installation', () => {
  const generated = readFileSync('apps/www/src/generated/agent-markdown.ts', 'utf8');

  assert.match(generated, /https:\/\/calendar\.gobrand\.app\/llms\.txt/);
  assert.match(generated, /npx skills add go-brand\/calendar/);
  assert.match(generated, /pnpm add @gobrand\/react-calendar @js-temporal\/polyfill/);
});
