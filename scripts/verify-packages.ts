import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { exampleDirectory, exampleFiles, exampleManifest } from './example-sources';
import { snippetInventory, snippetSource, writeSnippetSources } from './documented-snippets';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const temporaryRoot = mkdtempSync(join(tmpdir(), 'calendar-packages-'));
const packageDirectory = join(temporaryRoot, 'packages');
const consumerDirectory = join(temporaryRoot, 'consumer');
const coreVersion = JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8'))
  .version as string;
const reactVersion = JSON.parse(readFileSync(join(root, 'packages/react/package.json'), 'utf8'))
  .version as string;

function run(command: string, args: string[], cwd = root) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

try {
  mkdirSync(packageDirectory, { recursive: true });
  run('pnpm', [
    '--filter',
    '@gobrand/calendar-core',
    'pack',
    '--pack-destination',
    packageDirectory,
  ]);
  run('pnpm', [
    '--filter',
    '@gobrand/react-calendar',
    'pack',
    '--pack-destination',
    packageDirectory,
  ]);

  const coreTarball = join(packageDirectory, `gobrand-calendar-core-${coreVersion}.tgz`);
  const reactTarball = join(packageDirectory, `gobrand-react-calendar-${reactVersion}.tgz`);
  cpSync(join(root, 'fixtures/package-consumer'), consumerDirectory, { recursive: true });
  const manifestPath = join(consumerDirectory, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const exampleDependencies = Object.assign(
    {},
    ...exampleManifest.map((example) => example.dependencies),
  );
  manifest.dependencies = {
    ...exampleDependencies,
    'react-dom': '19.2.3',
    '@gobrand/calendar-core': `file:${coreTarball}`,
    '@gobrand/react-calendar': `file:${reactTarball}`,
    '@js-temporal/polyfill': '0.5.1',
    '@types/react': '19',
    react: '19.2.3',
    typescript: '5.7',
  };
  manifest.devDependencies = {
    '@types/react-dom': '19',
    vitest: '^4.1.9',
    jsdom: '^27.0.0',
    '@testing-library/react': '^16.3.0',
    '@testing-library/dom': '^10.4.1',
  };
  const manifestFiles = [...new Set(exampleManifest.flatMap(exampleFiles))];
  for (const file of manifestFiles) {
    const destination = join(consumerDirectory, 'examples', file);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(root, exampleDirectory, file), destination);
    assert.equal(
      readFileSync(destination, 'utf8'),
      readFileSync(join(root, exampleDirectory, file), 'utf8'),
    );
  }
  const snippetFiles = writeSnippetSources(join(consumerDirectory, 'snippets'));
  for (const [index, snippet] of snippetInventory.entries()) {
    assert.equal(
      readFileSync(join(consumerDirectory, 'snippets', snippetFiles[index]), 'utf8'),
      snippetSource(snippet).source,
    );
  }
  const timezoneIndex = snippetInventory.findIndex((snippet) => snippet.harness === 'timezone');
  writeFileSync(
    join(consumerDirectory, 'timezone-recipe.ts'),
    `export { normalizedEvent, getDate, getStart } from './snippets/${timezoneIndex}';\n`,
  );
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(
    join(consumerDirectory, 'pnpm-workspace.yaml'),
    [
      'overrides:',
      `  '@gobrand/calendar-core': 'file:${coreTarball}'`,
      'minimumReleaseAgeExclude:',
      `  - '@gobrand/calendar-core@${coreVersion}'`,
      '',
    ].join('\n'),
  );
  run('pnpm', ['install'], consumerDirectory);
  run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json'], consumerDirectory);
  run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.examples.json'], consumerDirectory);
  const compiledFiles = execFileSync(
    'pnpm',
    ['exec', 'tsc', '-p', 'tsconfig.examples.json', '--listFilesOnly'],
    { cwd: consumerDirectory, encoding: 'utf8' },
  ).split(/\r?\n/);
  for (const file of [
    ...manifestFiles.map((file) => join(consumerDirectory, 'examples', file)),
    ...snippetFiles.map((file) => join(consumerDirectory, 'snippets', file)),
  ]) {
    assert.ok(
      compiledFiles.includes(realpathSync(file)),
      `Compiler omitted published source: ${file}`,
    );
  }
  function expectCompileFailure(file: string, source: string | undefined, diagnostic: RegExp) {
    const path = join(consumerDirectory, file);
    const original = readFileSync(path, 'utf8');
    try {
      if (source === undefined) rmSync(path);
      else writeFileSync(path, source);
      let output = '';
      try {
        execFileSync('pnpm', ['exec', 'tsc', '-p', 'tsconfig.examples.json'], {
          cwd: consumerDirectory,
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (error) {
        output = String((error as { stdout: unknown }).stdout);
      }
      assert.match(output, diagnostic, `Expected compilation rejection for ${file}`);
    } finally {
      writeFileSync(path, original);
    }
  }
  const coreSnippet = snippetInventory.findIndex(
    (snippet) => snippet.file === 'packages/core/README.md',
  );
  const coreSource = readFileSync(
    join(consumerDirectory, 'snippets', `${coreSnippet}.tsx`),
    'utf8',
  );
  expectCompileFailure(
    `snippets/${coreSnippet}.tsx`,
    coreSource.replace('buildMonthView, createCalendar', 'absentDocumentedExport, createCalendar'),
    /has no exported member.*absentDocumentedExport/,
  );
  const entryPath = 'examples/basic-month.tsx';
  const entrySource = readFileSync(join(consumerDirectory, entryPath), 'utf8');
  expectCompileFailure(
    entryPath,
    entrySource.replace("'./calendar-ui'", "'./absent-helper'"),
    /Cannot find module.*absent-helper/,
  );
  expectCompileFailure(
    entryPath,
    entrySource.replace('month: true', 'invalidView: true'),
    /invalidView/,
  );
  expectCompileFailure('examples/cn.ts', undefined, /Cannot find module.*cn/);
  run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.examples.json'], consumerDirectory);
  run('pnpm', ['exec', 'vitest', 'run', '--config', 'vitest.runtime.config.ts'], consumerDirectory);
  run(
    'node',
    [
      '--input-type=module',
      '--eval',
      "import('@gobrand/react-calendar').then((value) => { if (typeof value.useCreateCalendar !== 'function') process.exit(1) })",
    ],
    consumerDirectory,
  );
  run(
    'node',
    [
      '--eval',
      "const value = require('@gobrand/calendar-core'); if (typeof value.createCalendar !== 'function') process.exit(1)",
    ],
    consumerDirectory,
  );

  const coreValues: string[] = JSON.parse(
    execFileSync(
      'node',
      [
        '--input-type=module',
        '--eval',
        "import * as values from '@gobrand/calendar-core'; console.log(JSON.stringify(Object.keys(values)))",
      ],
      { cwd: consumerDirectory, encoding: 'utf8' },
    ),
  );
  const utilities = readFileSync(join(root, 'apps/www/content/docs/core/utilities.mdx'), 'utf8');
  for (const match of utilities.matchAll(
    /import\s*\{([^}]+)\}\s*from\s*['"]@gobrand\/calendar-core['"]/g,
  )) {
    for (const specifier of match[1].split(',')) {
      if (specifier.trim().startsWith('type ')) continue;
      const name = specifier.trim().split(/\s+as\s+/)[0];
      assert.ok(
        coreValues.includes(name),
        `Utility documentation imports absent packed value: ${name}`,
      );
    }
  }

  const reactEsm = readFileSync(join(root, 'packages/react/dist/index.js'), 'utf8');
  if (!/^["']use client["'];/.test(reactEsm)) {
    throw new Error('React ESM output is missing the use client directive');
  }

  for (const tarball of [coreTarball, reactTarball]) {
    const contents = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' });
    if (/\.test\.d\.(?:ts|cts|mts)$/m.test(contents)) {
      throw new Error(`Packed package contains test declarations: ${tarball}`);
    }
  }

  console.log('Packed package verification passed');
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
