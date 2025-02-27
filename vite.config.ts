/// <reference types="vitest" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    })
  ],
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: "cit-[name]__[local]___[hash:base64:5]",
    },
  },
  build: {
    minify: false,
    lib: {
      entry: 'src/index.ts',
      name: 'Citadel',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].[format].js'
      },
    },
    cssCodeSplit: false,
    sourcemap: process.env.NODE_ENV === 'development',
    manifest: true,
    assetsDir: '',
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
