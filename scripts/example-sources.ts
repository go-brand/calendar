import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ExampleSource {
  name: string;
  entry: string;
  export: string;
  support: string[];
  dependencies: Record<string, string>;
  bootstrap?: string;
}

export const exampleDirectory = 'apps/www/src/components/examples';
export const exampleManifest: ExampleSource[] = JSON.parse(
  readFileSync(join(exampleDirectory, 'manifest.json'), 'utf8'),
);

export function exampleFiles(example: ExampleSource): string[] {
  return [
    ...new Set([
      example.entry,
      ...example.support,
      ...(example.bootstrap ? [example.bootstrap] : []),
    ]),
  ];
}

export function sourceMarkdown(files: string[]): string {
  return files
    .map((file) => {
      const source = readFileSync(join(exampleDirectory, file), 'utf8');
      return `### ${file}\n\n\`\`\`${file.endsWith('.tsx') ? 'tsx' : 'ts'}\n${source}\`\`\`\n`;
    })
    .join('\n');
}

export function resolvePreviews(body: string): string {
  return body.replace(/<CalendarPreview\s+name="([^"]+)"\s*\/>/g, (_, name: string) => {
    const example = exampleManifest.find((entry) => entry.name === name);
    if (!example) throw new Error(`Unknown CalendarPreview name: ${name}`);
    return `[Complete ${name} source](https://calendar.gobrand.app/examples/${name}.md) (export \`${example.export}\`).`;
  });
}
