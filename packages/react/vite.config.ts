/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

// Resolve @citadel_cli/core to its source (not the node_modules workspace symlink),
// so Vite bundles the engine into the JS output and vite-plugin-dts rewrites the
// emitted .d.ts imports to relative paths within dist/ — keeping the published
// package self-contained without depending on the unpublished @citadel_cli/core.
// See CORE_EXTRACTION_DESIGN.md.
const coreSrc = fileURLToPath(new URL('../core/src', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@citadel_cli/core': coreSrc,
    },
  },
  plugins: [
    react(),
    dts({
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
