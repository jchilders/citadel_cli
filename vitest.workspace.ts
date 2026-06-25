import { defineWorkspace } from 'vitest/config';

// Three test projects: the React library (jsdom, configured in
// packages/react/vite.config.ts) and the framework-agnostic @citadel/core
// engine + @citadel/cli adapter (plain node — no DOM). See
// CORE_EXTRACTION_DESIGN.md.
export default defineWorkspace([
  './packages/react/vite.config.ts',
  {
    test: {
      name: 'core',
      root: './packages/core',
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  },
  {
    // The CLI's Ink TUI tests are .tsx — use the automatic JSX runtime.
    esbuild: { jsx: 'automatic' },
    test: {
      name: 'cli',
      root: './packages/cli',
      environment: 'node',
      include: ['src/**/*.test.{ts,tsx}'],
    },
  },
]);
