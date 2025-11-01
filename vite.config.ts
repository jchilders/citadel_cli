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
    },
    rollupOptions: {
      external: (id) => {
        return id === 'react' || id === 'react-dom' || id.startsWith('react/') || id.startsWith('react-dom/');
      },
      output: [
        {
          format: 'es',
          entryFileNames: 'citadel.es.js',
          chunkFileNames: 'citadel.es.[hash].js',
          assetFileNames: 'citadel.[ext]',
          banner: `'use client';`,
        },
        {
          format: 'umd',
          name: 'Citadel',
          entryFileNames: 'citadel.umd.cjs',
          chunkFileNames: 'citadel.umd.[hash].cjs',
          assetFileNames: 'citadel.[ext]',
          banner: `'use client';`,
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'jsxRuntime',
            'react-dom/client': 'ReactDOMClient',
          },
        },
      ],
    },
    emptyOutDir: false,  // need to preserve the generated stylesheet; without this it gets deleted from dist/
    cssCodeSplit: false,
    sourcemap: process.env.NODE_ENV === 'development',
    manifest: true,
    assetsDir: 'dist',
  },
  optimizeDeps: {
    include: ['./src/styles/citadel.css', './src/styles/styles.css']
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
