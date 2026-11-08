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
import { exampleManifest, exampleFiles, sourceMarkdown, resolvePreviews } from './example-sources';

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
    '# GoBrand Calendar',
    '',
    '> Headless month, week, and day calendars built on Temporal. `@gobrand/react-calendar` for React, `@gobrand/calendar-core` for anything else.',
    '',
    'You render the markup. Calendar keeps the date and view, navigates, builds each grid in an explicit timezone, places your events by date and start time, and gives the half-open range to query.',
    '',
    '## Complete reference',
    '',
    `- [Complete documentation](${SITE_URL}/llms-full.txt): All Calendar documentation in one Markdown document`,
    `- [Calendar agent skill](${SITE_URL}/.well-known/agent-skills/calendar/SKILL.md): Reusable instructions for agents building Calendar interfaces`,
    '',
    '## Docs',
    '',
    `- [Introduction](${BASE_URL}): What Calendar does, with a first example`,
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
    'description: Use when building a month, week, or day calendar, a date picker, or a scheduling view in React or TypeScript with @gobrand/react-calendar or @gobrand/calendar-core. Covers events on the right day across timezones, time slots, navigation, URL state, and querying the visible range.',
    '---',
    '',
    '# GoBrand Calendar',
    '',
    'Headless month, week, and day calendars built on Temporal. You render the markup; Calendar keeps the date and view, navigates, builds each grid, and places your events.',
    '',
    '```bash',
    '# React',
    'pnpm add @gobrand/react-calendar @js-temporal/polyfill',
    '',
    '# Anything else',
    'pnpm add @gobrand/calendar-core @js-temporal/polyfill',
    '```',
    '',
    '## Rules',
    '',
    '- `getDate` returns the `Temporal.PlainDate` an event is on. For a timed event, convert it to the calendar timezone first: `event.start.withTimeZone(timeZone).toPlainDate()`.',
    '- `getStart` returns a `Temporal.ZonedDateTime` in the calendar timezone. Derive it from the same value as `getDate`.',
    "- The calendar timezone does not convert events. Set `timeZone` explicitly for server rendering or for anyone else's calendar.",
    '- Query with `visibleRange`: `>= start` and `< end`.',
    '- `weekStartsOn` is `1` (Monday) through `7` (Sunday), not `0` for Sunday.',
    '- Enable a view with `true`; leave it out to disable it. Week and day take `dayStart`, `dayEnd` (`Temporal.PlainTime`) and `slotDuration` (`Temporal.Duration`).',
    '- Wrong Temporal types throw a `TypeError` that names the type received. Convert, do not cast.',
    '- Use the calendar from the current render; subscribe in an effect that depends on `[calendar]`.',
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
    "  { id: 'launch', title: 'Product launch', date: Temporal.PlainDate.from('2026-07-10') },",
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
    lines.push('| Documentation topic | Description |');
    lines.push('|----------|-------------|');

    for (const doc of categoryDocs) {
      lines.push(
        `| [${doc.title}](${BASE_URL}${doc.urlPath ? `/${doc.urlPath}` : ''}) | ${doc.description} |`,
      );
    }

    lines.push('');
  }

  lines.push('## Types');
  lines.push('');
  lines.push(
    '- With `items`, `useCreateCalendar` also returns `activeView`. One configured view narrows it to that view; several give a union discriminated by `name`.',
  );
  lines.push(
    '- `useCalendar()` takes no event type. Infer events in each `useCalendarView({ view, items, getDate })` call.',
  );
  lines.push(
    '- `VisibleRange` is `{ start, end }`, both `Temporal.ZonedDateTime` in the calendar timezone.',
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

  lines.push(`Canonical: ${SITE_URL}${route}`, '', resolvePreviews(doc.body), '');
  return lines.join('\n');
}

function generateAgentMarkdown(docs: DocFile[]): Readonly<Record<string, string>> {
  for (const example of exampleManifest) {
    writeGenerated(
      `apps/www/public/examples/${example.name}.md`,
      [
        `# ${example.name}`,
        '',
        `Render the exported ${example.bootstrap ? 'StandaloneSuspenseMonth from ' + example.bootstrap : example.export + ' from ' + example.entry} in your React application.`,
        '',
        'Keep the files together in one directory. Install @gobrand/react-calendar and the dependencies below. CSS utility classes are optional; rendering and controls work without them. Website appearance requires the website styles.',
        '',
        `Dependencies: ${Object.entries(example.dependencies)
          .map(([name, version]) => `${name}@${version}`)
          .join(', ')}.`,
        '',
        sourceMarkdown(exampleFiles(example)),
      ].join('\n'),
    );
  }
  const markdownByPath: Record<string, string> = {
    '/': [
      '# GoBrand Calendar',
      '',
      '> Headless month, week, and day calendars built on Temporal.',
      '',
      `Canonical: ${SITE_URL}/`,
      '',
      `Coding agents should read ${SITE_URL}/llms.txt before making Calendar changes.`,
      '',
      'Install the Calendar Agent Skill with `npx skills add go-brand/calendar`.',
      '',
      'React installation: `pnpm add @gobrand/react-calendar @js-temporal/polyfill`.',
      '',
      `Human documentation: ${SITE_URL}/docs.`,
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
    '# GoBrand Calendar',
    '',
    '> Complete documentation for @gobrand/react-calendar and @gobrand/calendar-core.',
    '',
    ...docs.flatMap((markdown) => [markdown, '', '---', '']),
    '# Example sources',
    '',
    'All files below belong in the same directory. CSS classes are optional. The Suspense bootstrap supplies a stable QueryClientProvider.',
    '',
    ...exampleManifest.map(
      (example) =>
        `- ${example.name}: ${example.export} in ${example.entry}${example.bootstrap ? `; mount StandaloneSuspenseMonth from ${example.bootstrap}` : ''}. Dependencies: ${Object.entries(
          example.dependencies,
        )
          .map(([name, version]) => `${name}@${version}`)
          .join(', ')}.`,
    ),
    '',
    sourceMarkdown([...new Set(exampleManifest.flatMap(exampleFiles))]),
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
