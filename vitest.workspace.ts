import { defineWorkspace } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// The @citadel/* packages now publish built artifacts (their package.json main
// points at dist/), so the node test projects alias the bare specifiers back to
// source — tests run against the live source without a build step. The React
// project resolves @citadel/core via its own vite.config alias.
const coreSrc = fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url));
const sampleSrc = fileURLToPath(new URL('./packages/sample-commands/src/index.ts', import.meta.url));

// Three test projects: the React library (jsdom, configured in
// packages/react/vite.config.ts) and the framework-agnostic @citadel/core
// engine + @citadel/cli adapter (plain node — no DOM). See
// CORE_EXTRACTION_DESIGN.md.
export default defineWorkspace([
  './packages/react/vite.config.ts',
  {
    resolve: {
      alias: {
        '@citadel/core': coreSrc,
        '@citadel/sample-commands': sampleSrc,
      },
    },
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
    resolve: {
      alias: {
        '@citadel/core': coreSrc,
        '@citadel/sample-commands': sampleSrc,
      },
    },
    test: {
      name: 'cli',
      root: './packages/cli',
      environment: 'node',
      include: ['src/**/*.test.{ts,tsx}'],
    },
  },
]);
