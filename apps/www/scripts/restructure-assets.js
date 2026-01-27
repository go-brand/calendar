import { cpSync, mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const clientDir = join(import.meta.dirname, '../dist/client');
const tiempoDir = join(clientDir, 'tiempo');

// Create tiempo subdirectory
mkdirSync(tiempoDir, { recursive: true });

// Move all files from client to client/tiempo
const items = readdirSync(clientDir);
for (const item of items) {
  if (item === 'tiempo') continue;
  const src = join(clientDir, item);
  const dest = join(tiempoDir, item);
  cpSync(src, dest, { recursive: true });
  rmSync(src, { recursive: true, force: true });
}

console.log('✓ Restructured assets into /tiempo/ subdirectory');

// Fix wrangler.json routes to include both exact path and wildcard
const wranglerPath = join(import.meta.dirname, '../dist/server/wrangler.json');
const wranglerConfig = JSON.parse(readFileSync(wranglerPath, 'utf-8'));

wranglerConfig.routes = [
  { pattern: 'eng.gobrand.app/tiempo', zone_name: 'gobrand.app' },
  { pattern: 'eng.gobrand.app/tiempo/*', zone_name: 'gobrand.app' }
];

writeFileSync(wranglerPath, JSON.stringify(wranglerConfig));
console.log('✓ Fixed wrangler.json routes');
