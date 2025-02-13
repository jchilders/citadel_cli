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
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        entryFileNames: 'citadel.[format].js',
        chunkFileNames: 'citadel.[format].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'citadel.css';
          return assetInfo.name;
        },
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    emptyOutDir: false,  // need to preserve the generated stylesheet; without this it gets deleted from dist/
    cssCodeSplit: false,
    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: 'citadel-[local]'
      }
    },
    sourcemap: process.env.NODE_ENV === 'development',
    manifest: true,
    assetsDir: 'dist',
  },
  optimizeDeps: {
    include: ['./src/styles/citadel.css', './src/styles/styles.css']
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
