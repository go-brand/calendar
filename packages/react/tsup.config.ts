import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  external: ['react'],
  clean: true,
  splitting: false,
  treeshake: true,
});
