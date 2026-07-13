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

const DOCS_DIR = 'apps/www/content/docs';
const LLMS_TXT_PATH = 'apps/www/public/llms.txt';
const SKILL_MD_PATH = 'skills/calendar/SKILL.md';
const BASE_URL = 'https://eng.gobrand.app/calendar/docs';

interface DocFile {
  slug: string;
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  urlPath: string;
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
      // Skip index pages for llms.txt
      if (pagePath === 'index' || pagePath.endsWith('/index')) continue;

      const mdxPath = path.join(categoryDir, `${pagePath}.mdx`);
      if (!fs.existsSync(mdxPath)) {
        console.warn(`Warning: ${mdxPath} not found`);
        continue;
      }

      const content = fs.readFileSync(mdxPath, 'utf-8');
      const frontmatter = parseMdxFrontmatter(content);

      // Parenthesized directories are route groups and do not appear in public URLs.
      const urlCategory = category.startsWith('(') && category.endsWith(')') ? '' : category;
      const urlPath = [urlCategory, pagePath].filter(Boolean).join('/');

      // Determine subcategory from path (e.g., "api/use-calendar" -> "api")
      const subcategory = pagePath.includes('/') ? pagePath.split('/')[0] : undefined;

      docs.push({
        slug: pagePath.split('/').pop() || pagePath,
        category: categoryTitle,
        subcategory,
        title: frontmatter.title || pagePath,
        description: frontmatter.description || '',
        urlPath,
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
function generateSkillMd(docs: DocFile[]): void {
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
    '[See the complete Suspense example](https://eng.gobrand.app/calendar/docs/data-and-suspense).',
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
}

/**
 * Main
 */
function main(): void {
  console.log('📚 Documentation Generator\n');
  console.log('Source: MDX files in apps/www/content/docs/');
  console.log('─'.repeat(50));

  const docs = loadDocFiles();
  console.log(`\nFound ${docs.length} doc files\n`);

  generateLlmsTxt(docs);
  console.log('');

  generateSkillMd(docs);
  console.log('');

  console.log('─'.repeat(50));
  console.log('✅ Done!');
}

main();
