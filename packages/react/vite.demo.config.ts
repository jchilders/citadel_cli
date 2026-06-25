import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Builds the demo app (src/App.tsx via index.html) for GitHub Pages.
// The library build lives in vite.config.ts; this config is app-mode only.
export default defineConfig({
  plugins: [react()],
  base: '/citadel_cli/',
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
  },
})
