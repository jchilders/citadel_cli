import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'

// Builds the demo app (src/App.tsx via index.html) for GitHub Pages.
// The library build lives in vite.config.ts; this config is app-mode only.
//
// Resolve the workspace packages to their source (not the dist their
// package.json `main` now points at), so the demo bundles them directly and
// doesn't require a prior `build` of @citadel_cli/core. Mirrors the alias in
// vite.config.ts. @citadel_cli/sample-commands transitively imports core, so it
// needs the core alias too.
const coreSrc = fileURLToPath(new URL('../core/src', import.meta.url))
const sampleSrc = fileURLToPath(new URL('../sample-commands/src', import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: '/citadel_cli/',
  resolve: {
    alias: {
      '@citadel_cli/core': coreSrc,
      '@citadel_cli/sample-commands': sampleSrc,
    },
  },
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
  },
})
