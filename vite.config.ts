/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Citadel',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
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
    emptyOutDir: false,  // need to preserve the generated stylesheet; without this it gets deleted from dist/
    cssCodeSplit: false, // bundles all CSS together
    cssMinify: true,
  },
  test: {
    globals: true,
    environment: 'node',
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright',
    },
  },
})
