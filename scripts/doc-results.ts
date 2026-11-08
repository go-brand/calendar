import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ResultCheck {
  file: string;
  line: string;
  expected: string;
  actual: string;
}

const STATEMENT =
  /^(?:(?:const|let|var|import|export|return|if|for|while|function|type|interface|await)\b|\}|\/\/)/;

/**
 * Rewrites `expression; // result` lines into recorded checks. The expected
 * value is a quoted string, an array literal, or the comment's first word.
 */
export function instrument(code: string): string {
  return code
    .split('\n')
    .map((line) => {
      const match = line.match(/^(\s*)(\S.*?);\s*\/\/\s*(\S.*)$/);
      if (!match || STATEMENT.test(match[2])) return line;
      const [, indent, expression, comment] = match;
      const quoted = comment.match(/^(["'])(.*?)\1/);
      const expected = quoted
        ? quoted[2]
        : comment.startsWith('[')
          ? comment
          : comment.split(/\s/)[0];
      return `${indent}__check(${JSON.stringify(line.trim())}, () => (${expression}), ${JSON.stringify(expected)});`;
    })
    .join('\n');
}

function docFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? docFiles(path) : path.endsWith('.mdx') ? [path] : [];
  });
}

/** Plain TypeScript blocks that import the package and state at least one result. */
export function resultBlocks(files = docFiles('apps/www/content/docs')) {
  return files.flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/^```(?:ts|typescript)\r?\n([\s\S]*?)^```\s*$/gm)]
      .map((match) => match[1])
      .filter((code) => code.includes("from '@gobrand/calendar-core'") && instrument(code) !== code)
      .map((code) => ({ file, code })),
  );
}

const prelude = `const __checks: unknown[] = [];
function __check(line: string, evaluate: () => unknown, expected: string) {
  const value = evaluate();
  const list = expected.startsWith('[');
  __checks.push({
    line,
    expected: list ? JSON.stringify(JSON.parse(expected.replaceAll("'", '"'))) : expected,
    actual: list ? JSON.stringify(value) : String(value),
  });
}
`;

/** Runs every result block against the core source and returns each check. */
export function runResultBlocks(): ResultCheck[] {
  // Run inside packages/core so '@js-temporal/polyfill' resolves like it does for users.
  const directory = mkdtempSync('packages/core/.doc-results-');
  try {
    return resultBlocks().flatMap(({ file, code }, index) => {
      const path = join(directory, `block-${index}.ts`);
      const source = instrument(code).replaceAll("'@gobrand/calendar-core'", "'../src/index'");
      writeFileSync(path, `${prelude}${source}\nconsole.log(JSON.stringify(__checks));\n`);
      const output = execFileSync('pnpm', ['exec', 'tsx', path], { encoding: 'utf8' });
      const checks = JSON.parse(output.trim().split('\n').pop()!) as Omit<ResultCheck, 'file'>[];
      return checks.map((check) => ({ file, ...check }));
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
