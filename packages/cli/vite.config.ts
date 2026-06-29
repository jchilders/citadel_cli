import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import dts from 'vite-plugin-dts';

// @citadel_cli/cli bundles its own modules (run/tui/session/render-result) into a
// single ESM file but keeps @citadel_cli/core, ink, and react EXTERNAL — they are
// real runtime dependencies, resolved from the consumer's node_modules. The dts
// build uses tsconfig.build.json (which clears the root `paths`) so the emitted
// declarations keep `import('@citadel_cli/core')` as a bare specifier instead of
// inlining core's types. JSX uses the classic transform (React.createElement),
// matching how tui.tsx is authored. See CORE_EXTRACTION_DESIGN.md.
const external = (id: string) =>
  id === '@citadel_cli/core' ||
  id.startsWith('@citadel_cli/core/') ||
  id === 'ink' ||
  id === 'react' ||
  id === 'react-dom' ||
  id.startsWith('react/') ||
  id.startsWith('react-dom/');

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: './tsconfig.build.json',
      // Roll the declarations into a single self-contained dist/index.d.ts
      // (NodeNext-safe). @citadel_cli/core stays an external bare import — api-
      // extractor does not inline package dependencies.
      rollupTypes: true,
      include: ['src'],
      exclude: ['src/**/__tests__/**', 'src/**/*.test.*', 'src/demo.ts', 'src/demo-registry.ts'],
    }),
  ],
  esbuild: {
    jsx: 'transform',
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      external,
    },
  },
});
