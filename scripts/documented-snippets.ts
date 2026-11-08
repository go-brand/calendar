import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Snippet {
  file: string;
  fence: number;
  classification: 'complete' | 'contextual';
  harness: string;
}
export const snippetInventory: Snippet[] = JSON.parse(
  readFileSync('scripts/snippet-inventory.json', 'utf8'),
);

export function typescriptFences(source: string): string[] {
  return [...source.matchAll(/^```(?:ts|tsx|typescript)\r?\n([\s\S]*?)^```\s*$/gm)].map(
    (match) => match[1],
  );
}
function docFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? docFiles(path) : path.endsWith('.mdx') ? [path] : [];
  });
}
export function validateInventory(inventory = snippetInventory): void {
  const files = [
    'README.md',
    'packages/core/README.md',
    'packages/react/README.md',
    'skills/calendar/SKILL.md',
    ...docFiles('apps/www/content/docs'),
  ];
  const actual = files
    .flatMap((file) =>
      typescriptFences(readFileSync(file, 'utf8')).map((_, fence) => `${file}#${fence}`),
    )
    .sort();
  const expected = inventory.map((snippet) => `${snippet.file}#${snippet.fence}`).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(
      'TypeScript snippet inventory differs from published fences; classify every fence explicitly',
    );
}
const temporal = "import { Temporal } from '@js-temporal/polyfill';\n";
const react = "import { useCreateCalendar, useCalendar } from '@gobrand/react-calendar';\n";
const events =
  "const events = [{ id: 'event', title: 'Event', date: Temporal.PlainDate.from('2026-07-10'), startsAt: Temporal.ZonedDateTime.from('2026-07-10T10:00+02:00[Europe/Madrid]') }];\n";
const controller =
  "import { createCalendar } from '@gobrand/calendar-core';\nconst calendar = createCalendar({ views: { month: true, week: true }, date: Temporal.PlainDate.from('2026-07-10') });\n";
const harnesses: Record<string, { before: string; after: string }> = {
  complete: { before: '', after: '\nexport {};\n' },
  'react-items': { before: temporal + react + events, after: '\nexport {};\n' },
  'react-controller': { before: react, after: '\nexport {};\n' },
  'temporal-types': { before: temporal, after: '\nexport {};\n' },
  'core-controller': { before: temporal + controller, after: '\nexport {};\n' },
  projections: {
    before:
      temporal +
      "import { buildMonthView, buildWeekView } from '@gobrand/calendar-core';\n" +
      controller +
      events +
      'const summaries = events;\n',
    after: '\nexport {};\n',
  },
  'create-core': {
    before: temporal + "import { createCalendar } from '@gobrand/calendar-core';\n",
    after: '\nexport {};\n',
  },
  subscription: {
    before: "import { useEffect } from 'react';\n" + temporal + controller,
    after: '\nexport {};\n',
  },
  routing: {
    before:
      temporal +
      react +
      "type Search = { date: Temporal.PlainDate; view: 'month' | 'week' };\nconst search: Search = { date: Temporal.PlainDate.from('2026-07-10'), view: 'month' };\nfunction navigate({ search: update }: { search: (previous: Search) => Search }) { Object.assign(search, update(search)); }\n",
    after: '\nexport {};\n',
  },
  query: {
    before:
      temporal +
      controller +
      'const db = { event: { async findMany(query: { where: { startsAt: { gte: Temporal.Instant; lt: Temporal.Instant } } }) { return query; } } };\n',
    after: '\nexport {};\n',
  },
  timezone: { before: '', after: '\nexport { normalizedEvent, getDate, getStart };\n' },
};
export function snippetSource(snippet: Snippet): { bytes: string; source: string } {
  const bytes = typescriptFences(readFileSync(snippet.file, 'utf8'))[snippet.fence];
  const harness = harnesses[snippet.harness];
  if (bytes === undefined || !harness)
    throw new Error(`Missing snippet or harness: ${snippet.file}#${snippet.fence}`);
  return { bytes, source: harness.before + bytes + harness.after };
}
export function writeSnippetSources(directory: string): string[] {
  validateInventory();
  mkdirSync(directory, { recursive: true });
  return snippetInventory.map((snippet, index) => {
    const file = `${index}.tsx`;
    writeFileSync(join(directory, file), snippetSource(snippet).source);
    return file;
  });
}
