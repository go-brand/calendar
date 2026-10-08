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

const baselineCompiler = 'node_modules/typescript/bin/tsc';
const targetedCompiler = 'node_modules/typescript-targeted/bin/tsc';

function assertCompilerVersion(directory: string, compiler: string, expected: string) {
  const version = execFileSync('node', [compiler, '--version'], {
    cwd: directory,
    encoding: 'utf8',
  }).trim();
  assert.equal(version, `Version ${expected}`, `Unexpected compiler at ${compiler}`);
  console.log(`${compiler}: ${version}`);
}

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
    typescript: '5.7.3',
    'typescript-targeted': 'npm:typescript@5.9.3',
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
  assertCompilerVersion(consumerDirectory, baselineCompiler, '5.7.3');
  assertCompilerVersion(consumerDirectory, targetedCompiler, '5.9.3');
  run('node', [targetedCompiler, '-p', 'tsconfig.node16.json'], consumerDirectory);
  run('node', [targetedCompiler, '-p', 'tsconfig.nodenext.json'], consumerDirectory);
  run('node', [baselineCompiler, '-p', 'tsconfig.node16.json'], consumerDirectory);
  run('node', [baselineCompiler, '-p', 'tsconfig.nodenext.json'], consumerDirectory);
  run('node', [baselineCompiler, '-p', 'tsconfig.json'], consumerDirectory);
  run('node', [baselineCompiler, '-p', 'tsconfig.examples.json'], consumerDirectory);
  const compiledFiles = execFileSync(
    'node',
    [baselineCompiler, '-p', 'tsconfig.examples.json', '--listFilesOnly'],
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
        execFileSync('node', [baselineCompiler, '-p', 'tsconfig.examples.json'], {
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
  run('node', [baselineCompiler, '-p', 'tsconfig.examples.json'], consumerDirectory);
  run('pnpm', ['exec', 'vitest', 'run', '--config', 'vitest.runtime.config.ts'], consumerDirectory);
  for (const format of ['import', 'require']) {
    for (const name of ['@gobrand/calendar-core', '@gobrand/react-calendar']) {
      const load = format === 'import' ? `await import('${name}')` : `require('${name}')`;
      run(
        'node',
        [
          '--input-type=' + (format === 'import' ? 'module' : 'commonjs'),
          '--eval',
          `
        const assert = ${format === 'import' ? "(await import('node:assert/strict')).default" : "require('node:assert/strict')"};
        const { Temporal } = ${format === 'import' ? "await import('@js-temporal/polyfill')" : "require('@js-temporal/polyfill')"};
        const values = ${load};
        const date = Temporal.PlainDate.from('2026-07-10');
        const calendar = values.createCalendar({ views: { month: true }, date });
        const month = values.buildMonthView({ calendar, items: [{ id: 'item', date }], getDate: item => item.date });
        assert.equal(month.month.toString(), '2026-07');
        assert.equal(month.weeks.flat().find(day => day.date.equals(date)).items[0].id, 'item');
        calendar.next();
        assert.equal(values.buildMonthView({ calendar }).month.toString(), '2026-08');
      `,
        ],
        consumerDirectory,
      );
    }
  }

  function verifyPeer(directory: string, major: string) {
    assertCompilerVersion(directory, baselineCompiler, '5.7.3');
    run(
      'node',
      [
        '--input-type=module',
        '--eval',
        `
      import assert from 'node:assert/strict';
      import { createRequire } from 'node:module';
      import { realpathSync } from 'node:fs';
      const require = createRequire(import.meta.url);
      const react = require.resolve('react');
      for (const name of ['@gobrand/react-calendar', 'react-dom', '@testing-library/react']) {
        assert.equal(realpathSync(createRequire(require.resolve(name)).resolve('react')), realpathSync(react));
      }
      for (const name of ['react', 'react-dom', '@types/react', '@types/react-dom']) {
        assert.equal(require(name + '/package.json').version.split('.')[0], '${major}');
      }
    `,
      ],
      directory,
    );
    run('node', [baselineCompiler, '-p', 'tsconfig.peer.json'], directory);
    run('pnpm', ['exec', 'vitest', 'run', '--config', 'vitest.peer.config.ts'], directory);
  }
  verifyPeer(consumerDirectory, '19');
  const peerDirectory = join(temporaryRoot, 'react18');
  mkdirSync(peerDirectory);
  for (const file of [
    'react-peer.test.tsx',
    'tsconfig.peer.json',
    'vitest.peer.config.ts',
    'pnpm-workspace.yaml',
  ]) {
    cpSync(join(consumerDirectory, file), join(peerDirectory, file));
  }
  const peerManifest = {
    ...manifest,
    dependencies: {
      '@gobrand/calendar-core': `file:${coreTarball}`,
      '@gobrand/react-calendar': `file:${reactTarball}`,
      '@js-temporal/polyfill': '0.5.1',
      react: '18.3.1',
      'react-dom': '18.3.1',
      '@types/react': '18',
      typescript: '5.7.3',
    },
    devDependencies: { ...manifest.devDependencies, '@types/react-dom': '18' },
  };
  writeFileSync(join(peerDirectory, 'package.json'), `${JSON.stringify(peerManifest, null, 2)}\n`);
  run('pnpm', ['install'], peerDirectory);
  verifyPeer(peerDirectory, '18');

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
