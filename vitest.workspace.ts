import { defineWorkspace } from 'vitest/config';

// Two test projects: the React library/app (jsdom, configured in vite.config.ts)
// and the framework-agnostic @citadel/core engine (plain node — no DOM). See
// CORE_EXTRACTION_DESIGN.md.
export default defineWorkspace([
  './vite.config.ts',
  {
    test: {
      name: 'core',
      root: './packages/core',
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  },
]);
