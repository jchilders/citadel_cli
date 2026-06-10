/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { viteShadowDOM } from './plugins/vite-shadow-dom'

// https://vite.dev/config/
export default defineConfig({
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
      ],
    }),
    viteShadowDOM({
      injectMethod: 'constructable',
      include: ['src/components/Citadel/**/*.{ts,tsx}']
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
