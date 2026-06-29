/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

// Resolve @citadel_cli/core to its source so Vite bundles the engine into the
// JS output (self-contained ES + UMD, no runtime resolution needed) and the
// vitest run executes against live source.
//
// The emitted .d.ts, however, must NOT inline core via this alias — doing so
// produced relative paths that escape the package (../../core/src) and broke
// consumer type resolution. `aliasesExclude` leaves `@citadel_cli/core` as a
// bare import in the declarations, resolved from the published package (declared
// as a dependency). See CORE_EXTRACTION_DESIGN.md.
const coreSrc = fileURLToPath(new URL('../core/src', import.meta.url))
const CORE = '@citadel_cli/core'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      [CORE]: coreSrc,
    },
  },
  plugins: [
    react(),
    dts({
      // Keep @citadel_cli/core a bare import in the emitted .d.ts (resolved from
      // the published package) instead of following the source alias, which
      // would emit package-escaping relative paths.
      aliasesExclude: [CORE],
      insertTypesEntry: true,
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.*',
        'src/__test-utils__/**',
        'src/test/**',
        'src/examples/**',
        'src/App.tsx',
        'src/main.tsx',
        'packages/**/__tests__/**',
        'packages/**/*.test.*',
      ],
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Citadel',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: (id) => {
        return id === 'react' || id === 'react-dom' || id.startsWith('react/') || id.startsWith('react-dom/');
      },
      output: {
        entryFileNames: 'citadel.[format].js',
        chunkFileNames: 'citadel.[format].js',
        assetFileNames: 'citadel.[ext]',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    emptyOutDir: true,  // safe to clear dist/: nothing else writes to it before vite build
    cssCodeSplit: false,
    sourcemap: process.env.NODE_ENV === 'development',
    assetsDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**'],
    coverage: {
      provider: 'v8',
      exclude: [
        '**/src/examples/**',
        '**/basicCommands.ts',
        '**/tests/e2e/**',
        '**/tests/harness/**'
      ]
    }
  },
})
