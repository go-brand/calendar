import { resolve } from 'node:path';
import { defineConfig } from 'tsup';

const nativeTemporalPath = resolve('src/temporal.native.ts');

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    splitting: false,
    treeshake: true,
    external: ['@js-temporal/polyfill'],
  },
  {
    entry: ['src/native.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: false,
    splitting: false,
    treeshake: true,
    esbuildPlugins: [
      {
        name: 'native-temporal',
        setup(build) {
          build.onResolve({ filter: /\/temporal$/ }, () => ({
            path: nativeTemporalPath,
          }));
        },
      },
    ],
  },
]);
