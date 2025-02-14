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
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: "cit-[name]__[local]___[hash:base64:5]",
    },
  },
  build: {
    lib: {
      entry: 'src/components/Citadel/index.ts',
      name: 'Citadel',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        entryFileNames: 'citadel.[format].js',
        chunkFileNames: 'citadel.[format].js',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
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
