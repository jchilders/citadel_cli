/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import dts from 'vite-plugin-dts';

// @citadel_cli/core is dependency-free, so the library build bundles every module
// into a single ESM file (dist/index.js) and vite-plugin-dts emits the matching
// type declarations (dist/index.d.ts + per-module .d.ts). Published consumers
// — @citadel_cli/cli and any downstream CLI — import the built artifacts; local
// dev/test resolves the source via the root tsconfig `paths` and the vitest
// workspace aliases. See CORE_EXTRACTION_DESIGN.md.
export default defineConfig({
  plugins: [
    dts({
      // Roll every declaration into a single self-contained dist/index.d.ts so
      // the published types carry no extensionless relative re-exports — those
      // break consumers on NodeNext/Node16 module resolution.
      rollupTypes: true,
      include: ['src'],
      exclude: ['src/**/__tests__/**', 'src/**/*.test.*'],
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    emptyOutDir: true,
    sourcemap: false,
  },
});
