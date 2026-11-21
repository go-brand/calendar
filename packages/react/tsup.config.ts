import { resolve } from 'node:path';
import { defineConfig } from 'tsup';

const nativeTemporalPath = resolve('src/temporal-runtime.native.ts');

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    external: ['react', '@gobrand/calendar-core', '@js-temporal/polyfill'],
    clean: true,
    splitting: false,
    treeshake: false,
  },
  {
    entry: ['src/native.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    external: ['react', '@gobrand/calendar-core/native'],
    clean: false,
    splitting: false,
    treeshake: false,
    esbuildPlugins: [
      {
        name: 'native-temporal-react',
        setup(build) {
          build.onResolve({ filter: /\/temporal-runtime$/ }, () => ({
            path: nativeTemporalPath,
          }));
          build.onResolve({ filter: /^@gobrand\/calendar-core$/ }, () => ({
            path: '@gobrand/calendar-core/native',
            external: true,
          }));
        },
      },
    ],
  },
]);
