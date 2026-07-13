/**
 * Documentation Generator
 *
 * Single source of truth: MDX files in apps/www/content/docs/
 * Generates:
 * 1. llms.txt (apps/www/public/llms.txt)
 * 2. SKILL.md (skills/calendar/SKILL.md)
 *
 * Usage: pnpm generate:docs
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';

const DOCS_DIR = 'apps/www/content/docs';
const LLMS_TXT_PATH = 'apps/www/public/llms.txt';
const LLMS_FULL_TXT_PATH = 'apps/www/public/llms-full.txt';
const ROBOTS_TXT_PATH = 'apps/www/public/robots.txt';
const SITEMAP_XML_PATH = 'apps/www/public/sitemap.xml';
const SKILL_MD_PATH = 'skills/calendar/SKILL.md';
const PUBLISHED_SKILL_PATH = 'apps/www/public/.well-known/agent-skills/calendar/SKILL.md';
const SKILL_INDEX_PATH = 'apps/www/public/.well-known/agent-skills/index.json';
const AGENT_MARKDOWN_PATH = 'apps/www/src/generated/agent-markdown.ts';
const SITE_URL = 'https://calendar.gobrand.app';
const BASE_URL = `${SITE_URL}/docs`;

interface DocFile {
  slug: string;
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  urlPath: string;
  body: string;
}

interface MetaJson {
  root?: boolean;
  title?: string;
  description?: string;
  icon?: string;
  pages: string[];
}

/**
 * Parse MDX frontmatter
 */
function parseMdxFrontmatter(content: string): Record<string, string> {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return {};
  }

  const frontmatter: Record<string, string> = {};
  const frontmatterLines = frontmatterMatch[1].split('\n');
  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

function stripMdxFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
}

/**
 * Load pages from a meta.json, handling spread syntax and separators
 */
function loadPagesFromMeta(metaPath: string): string[] {
  if (!fs.existsSync(metaPath)) return [];

  const meta: MetaJson = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const pages: string[] = [];

  for (const page of meta.pages) {
    // Skip section separators like "---Getting Started---"
    if (page.startsWith('---') && page.endsWith('---')) continue;

    // Handle spread syntax like "...api"
    if (page.startsWith('...')) {
      const subdir = page.slice(3);
      const subdirMetaPath = path.join(path.dirname(metaPath), subdir, 'meta.json');
      const subPages = loadPagesFromMeta(subdirMetaPath);
      pages.push(...subPages.map((p) => `${subdir}/${p}`));
    } else {
      pages.push(page);
    }
  }

  return pages;
}

/**
 * Recursively load all MDX doc files
 */
function loadDocFiles(): DocFile[] {
  const docs: DocFile[] = [];

  // Load root meta.json to get top-level categories
  const rootMetaPath = path.join(DOCS_DIR, 'meta.json');
  if (!fs.existsSync(rootMetaPath)) {
    console.error('Root meta.json not found');
    return docs;
  }

  const rootMeta: MetaJson = JSON.parse(fs.readFileSync(rootMetaPath, 'utf-8'));

  for (const category of rootMeta.pages) {
    // Handle route groups like (react)
    const categoryDir = path.join(DOCS_DIR, category);
    if (!fs.existsSync(categoryDir)) continue;

    const categoryMetaPath = path.join(categoryDir, 'meta.json');
    if (!fs.existsSync(categoryMetaPath)) continue;

    const categoryMeta: MetaJson = JSON.parse(fs.readFileSync(categoryMetaPath, 'utf-8'));
    const categoryTitle = categoryMeta.title || category;

    // Get all pages for this category (handles nested meta.json and spread syntax)
    const pages = loadPagesFromMeta(categoryMetaPath);

    for (const pagePath of pages) {
      const mdxPath = path.join(categoryDir, `${pagePath}.mdx`);
      if (!fs.existsSync(mdxPath)) {
        console.warn(`Warning: ${mdxPath} not found`);
        continue;
      }

      const content = fs.readFileSync(mdxPath, 'utf-8');
      const frontmatter = parseMdxFrontmatter(content);

      // Parenthesized directories are route groups and do not appear in public URLs.
      const urlCategory = category.startsWith('(') && category.endsWith(')') ? '' : category;
      const routePath = [urlCategory, pagePath].filter(Boolean).join('/');
      const urlPath =
        routePath === 'index'
          ? ''
          : routePath.endsWith('/index')
            ? routePath.slice(0, -'/index'.length)
            : routePath;

      // Determine subcategory from path (e.g., "api/use-calendar" -> "api")
      const subcategory = pagePath.includes('/') ? pagePath.split('/')[0] : undefined;

      docs.push({
        slug: pagePath.split('/').pop() || pagePath,
        category: categoryTitle,
        subcategory,
        title: frontmatter.title || pagePath,
        description: frontmatter.description || '',
        urlPath,
        body: stripMdxFrontmatter(content),
      });
    }
  }

  return docs;
}

/**
 * Generate llms.txt
 */
function generateLlmsTxt(docs: DocFile[]): void {
  console.log('Generating llms.txt...');

  const lines: string[] = [
    '# temporal-calendar',
    '',
    '> A lightweight utility library for building calendar UIs with the Temporal API.',
    '',
    'temporal-calendar provides type-safe calendar building blocks using the modern Temporal API. It supports month, week, and day views with timezone awareness, DST-safe operations, an item-agnostic controller, and locally inferred view projections.',
    '',
    '## Complete reference',
    '',
    `- [Complete documentation](${SITE_URL}/llms-full.txt): All Calendar documentation in one Markdown document`,
    `- [Calendar agent skill](${SITE_URL}/.well-known/agent-skills/calendar/SKILL.md): Reusable instructions for agents building Calendar interfaces`,
    '',
    '## Docs',
    '',
    `- [Introduction](${BASE_URL}): Overview of temporal-calendar and key features`,
    `- [Core Installation](${BASE_URL}/core/installation): Getting started with @gobrand/calendar-core`,
    `- [React Installation](${BASE_URL}/installation): Getting started with @gobrand/react-calendar`,
    '',
  ];

  // Group docs by category and subcategory
  const byCategory = new Map<string, Map<string | undefined, DocFile[]>>();

  for (const doc of docs) {
    if (!byCategory.has(doc.category)) {
      byCategory.set(doc.category, new Map());
    }
    const categoryMap = byCategory.get(doc.category)!;
    if (!categoryMap.has(doc.subcategory)) {
      categoryMap.set(doc.subcategory, []);
    }
    categoryMap.get(doc.subcategory)!.push(doc);
  }

  // Generate sections
  for (const [category, subcategoryMap] of byCategory) {
    lines.push(`## ${category}`);
    lines.push('');

    for (const [subcategory, categoryDocs] of subcategoryMap) {
      if (subcategory) {
        lines.push(`### ${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}`);
        lines.push('');
      }

      for (const doc of categoryDocs) {
        const url = `${BASE_URL}/${doc.urlPath}`;
        lines.push(`- [${doc.title}](${url}): ${doc.description}`);
      }

      lines.push('');
    }
  }

  fs.writeFileSync(LLMS_TXT_PATH, lines.join('\n'));
  console.log(`  ✓ ${LLMS_TXT_PATH}`);
}

/**
 * Generate SKILL.md
 */
function generateSkillMd(docs: DocFile[]): string {
  console.log('Generating SKILL.md...');

  const lines: string[] = [
    '---',
    'name: calendar',
    'description: Use when building calendar UIs with the Temporal API. Provides month, week, and day views with timezone awareness, DST-safe operations, and React hooks for state management.',
    '---',
    '',
    '# temporal-calendar - Calendar Building Blocks',
    '',
    'Lightweight utility library for building calendar UIs with the Temporal API.',
    '',
    '```bash',
    '# Core (framework-agnostic)',
    'npm install @gobrand/calendar-core @js-temporal/polyfill',
    '',
    '# React',
    'npm install @gobrand/react-calendar @js-temporal/polyfill',
    '```',
    '',
    '## Quick start',
    '',
    '```tsx',
    "import { Temporal } from '@js-temporal/polyfill'",
    "import { useCreateCalendar } from '@gobrand/react-calendar'",
    '',
    'type Event = {',
    '  id: string',
    '  title: string',
    '  date: Temporal.PlainDate',
    '}',
    '',
    'const events: Event[] = [',
    "  { id: 'launch', title: 'Launch', date: Temporal.Now.plainDateISO() },",
    ']',
    '',
    'function Calendar() {',
    '  const calendar = useCreateCalendar({',
    '    views: { month: true },',
    '    items: events,',
    '    getDate: event => event.date,',
    '  })',
    '  const month = calendar.activeView',
    '',
    '  return (',
    '    <section>',
    '      <button onClick={calendar.previous}>Previous</button>',
    '      <button onClick={calendar.today}>Today</button>',
    '      <button onClick={calendar.next}>Next</button>',
    '      <h2>{calendar.title()}</h2>',
    '',
    '      {month.weeks.flat().map(day => (',
    '        <div key={day.id}>',
    "          {day.date.toString()}: {day.items.map(event => event.title).join(', ')}",
    '        </div>',
    '      ))}',
    '    </section>',
    '  )',
    '}',
    '```',
    '',
    '## Using Suspense',
    '',
    'When each view fetches its own data, keep the controller above the Suspense boundary and call `useCalendarView` after the data is ready.',
    '',
    '[See the complete Suspense example](https://calendar.gobrand.app/docs/data-and-suspense).',
    '',
  ];

  // Group by category
  const byCategory = new Map<string, DocFile[]>();
  for (const doc of docs) {
    const existing = byCategory.get(doc.category) || [];
    existing.push(doc);
    byCategory.set(doc.category, existing);
  }

  // Generate tables
  for (const [category, categoryDocs] of byCategory) {
    lines.push(`## ${category}`);
    lines.push('');
    lines.push('| Function | Description |');
    lines.push('|----------|-------------|');

    for (const doc of categoryDocs) {
      const displayName =
        doc.title.includes('use') || doc.title.includes('create')
          ? `\`${doc.title}()\``
          : `\`${doc.title}\``;
      lines.push(`| ${displayName} | ${doc.description} |`);
    }

    lines.push('');
  }

  // Add a concise map of the public types without duplicating their declarations.
  lines.push('## Key Types');
  lines.push('');
  lines.push(
    '- `CalendarController<TViews>` contains the current date and view, typed `viewNames`, resolved view configuration, visible range, title, navigation methods, setters, and `subscribe`.',
  );
  lines.push(
    '- `VisibleRange` contains `start` and `end` as `Temporal.ZonedDateTime` values in the controller timezone.',
  );
  lines.push(
    '- `MonthView<TItem>`, `WeekView<TItem>`, and `DayView<TItem>` are discriminated by their `name` field.',
  );
  lines.push('- `NonEmptyCalendarViews` requires at least one of `month`, `week`, or `day`.');
  lines.push('');
  lines.push('## Inference rules');
  lines.push('');
  lines.push(
    '- `useCreateCalendar` with `items` and `getDate` returns the controller plus `activeView`; without items it returns the item-agnostic controller.',
  );
  lines.push(
    '- A single configured view narrows `activeView` to that view; multiple views produce only the configured discriminated union.',
  );
  lines.push(
    '- `useCalendar()` accepts no item generic. Infer items in each literal `useCalendarView({ view, items, getDate })` call.',
  );
  lines.push('');
  lines.push('## View configuration');
  lines.push('');
  lines.push('- Use `month: true`, `week: true`, or `day: true` for default geometry.');
  lines.push(
    '- Supply an object only for custom week/day geometry such as `dayStart`, `dayEnd`, or `slotDuration`.',
  );
  lines.push(
    '- Omit a key to make that view unavailable. `false` is intentionally rejected so key presence always means configured.',
  );
  lines.push('');
  lines.push('## Initialization and timezone');
  lines.push('');
  lines.push(
    '- `timeZone` accepts an IANA timezone string and defaults to `Temporal.Now.timeZoneId()`. The visible range, `today()`, and `isToday` all use that zone.',
  );
  lines.push(
    '- Use `defaultDate` and `defaultView` for uncontrolled initial state. The date defaults to today in the calendar timezone; the view defaults to the first configured view.',
  );
  lines.push(
    '- Use `date` with `onDateChange`, or `view` with `onViewChange`, for controlled state. A controlled view must be configured in `views`.',
  );
  lines.push(
    '- Core `createCalendar` uses `date` and `view` directly, with `defaultView` as its uncontrolled-style initial-view alias.',
  );
  lines.push('');

  const content = lines.join('\n');

  // Write to repo
  const skillDir = path.dirname(SKILL_MD_PATH);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(SKILL_MD_PATH, content);
  console.log(`  ✓ ${SKILL_MD_PATH}`);
  return content;
}

function writeGenerated(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log(`  ✓ ${file}`);
}

function markdownForDoc(doc: DocFile): string {
  const route = `/docs${doc.urlPath ? `/${doc.urlPath}` : ''}`;
  const lines = [`# ${doc.title}`, ''];

  if (doc.description) {
    lines.push(`> ${doc.description}`, '');
  }

  lines.push(`Canonical: ${SITE_URL}${route}`, '', doc.body, '');
  return lines.join('\n');
}

function generateAgentMarkdown(docs: DocFile[]): Readonly<Record<string, string>> {
  const markdownByPath: Record<string, string> = {
    '/': [
      '# temporal-calendar',
      '',
      '> Temporal-first building blocks for month, week, and day calendar interfaces.',
      '',
      `Canonical: ${SITE_URL}/`,
      '',
      `Read the documentation at ${SITE_URL}/docs.`,
      '',
    ].join('\n'),
  };

  for (const doc of docs) {
    const route = `/docs${doc.urlPath ? `/${doc.urlPath}` : ''}`;
    markdownByPath[route] = markdownForDoc(doc);
  }

  const moduleSource = [
    '// Generated by scripts/generate-docs.ts. Do not edit.',
    '',
    `export const agentMarkdownByPath: Readonly<Record<string, string>> = ${JSON.stringify(markdownByPath, null, 2)};`,
    '',
  ].join('\n');
  writeGenerated(AGENT_MARKDOWN_PATH, moduleSource);

  return markdownByPath;
}

function generateLlmsFull(markdownByPath: Readonly<Record<string, string>>): void {
  const docs = Object.entries(markdownByPath)
    .filter(([route]) => route.startsWith('/docs'))
    .map(([, markdown]) => markdown.trim());
  const content = [
    '# temporal-calendar',
    '',
    '> Complete documentation for the Temporal-first Calendar packages.',
    '',
    ...docs.flatMap((markdown) => [markdown, '', '---', '']),
  ].join('\n');

  writeGenerated(LLMS_FULL_TXT_PATH, content);
}

function generateRobotsTxt(): void {
  const bots = [
    '*',
    'GPTBot',
    'OAI-SearchBot',
    'Claude-Web',
    'Google-Extended',
    'Amazonbot',
    'anthropic-ai',
    'Bytespider',
    'CCBot',
    'Applebot-Extended',
  ];
  const lines = bots.flatMap((bot) => [
    `User-agent: ${bot}`,
    'Allow: /',
    'Content-Signal: ai-train=no, search=yes, ai-input=yes',
    '',
  ]);
  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`, '');

  writeGenerated(ROBOTS_TXT_PATH, lines.join('\n'));
}

function generateSitemap(markdownByPath: Readonly<Record<string, string>>): void {
  const routes = new Set([
    ...Object.keys(markdownByPath),
    '/llms.txt',
    '/llms-full.txt',
    '/.well-known/agent-skills/index.json',
    '/.well-known/agent-skills/calendar/SKILL.md',
  ]);
  const urls = [...routes].map((route) => `  <url><loc>${SITE_URL}${route}</loc></url>`).join('\n');
  const content = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');

  writeGenerated(SITEMAP_XML_PATH, content);
}

function publishAgentSkill(skill: string): void {
  writeGenerated(PUBLISHED_SKILL_PATH, skill);

  const digest = createHash('sha256').update(skill).digest('hex');
  const index = {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'calendar',
        type: 'skill-md',
        description:
          'Build Temporal-first month, week, and day calendar interfaces with @gobrand/calendar-core and @gobrand/react-calendar.',
        url: '/.well-known/agent-skills/calendar/SKILL.md',
        digest: `sha256:${digest}`,
      },
    ],
  };

  writeGenerated(SKILL_INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`);
}

/**
 * Main
 */
function main(): void {
  console.log('📚 Documentation Generator\n');
  console.log('Source: MDX files in apps/www/content/docs/');
  console.log('─'.repeat(50));

  const docs = loadDocFiles();
  const referenceDocs = docs.filter((doc) => doc.slug !== 'index');
  console.log(`\nFound ${docs.length} doc files\n`);

  generateLlmsTxt(referenceDocs);
  console.log('');

  const skill = generateSkillMd(referenceDocs);
  console.log('');

  const markdownByPath = generateAgentMarkdown(docs);
  generateLlmsFull(markdownByPath);
  generateRobotsTxt();
  generateSitemap(markdownByPath);
  publishAgentSkill(skill);
  console.log('');

  console.log('─'.repeat(50));
  console.log('✅ Done!');
}

main();
