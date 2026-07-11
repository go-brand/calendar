import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  manifest.dependencies = {
    '@gobrand/calendar-core': `file:${coreTarball}`,
    '@gobrand/react-calendar': `file:${reactTarball}`,
    '@js-temporal/polyfill': '0.5.1',
    '@types/react': '19',
    '@tanstack/react-query': '5',
    react: '19',
    typescript: '5.7',
  };
  manifest.pnpm = {
    overrides: {
      '@gobrand/calendar-core': `file:${coreTarball}`,
    },
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  run('pnpm', ['install'], consumerDirectory);
  run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json'], consumerDirectory);
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
