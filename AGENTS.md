# Repository Guidelines

## Project Structure & Module Organization
Core TypeScript sources live in `src/`. The `components/` directory holds the React UI primitives for the in-app console, while `styles/` contains Tailwind-backed utility exports. Shared testing helpers live under `src/__test-utils__/`, and the Vitest setup sits in `src/test/setup.ts`. End-to-end suites are organized in `tests/e2e`, and runnable examples live in `examples/`. Build artifacts populate `dist/`; do not edit generated files there.

## Build, Test, and Development Commands
Use `npm run dev` to launch the Vite dev server against `index.html`. `npm run build` compiles TypeScript and bundles the library (tsc + vite). Serve a production snapshot with `npm run preview`. Run `npm run lint` to apply the ESLint ruleset, and `npm run lint:fix` for safe auto-fixes. Execute `npm test` for Vitest unit suites, `npm run coverage` to review coverage reports, and `npm run test:e2e` for Playwright browser checks; `npm run test:e2e:ui` opens the Playwright inspector.

## Coding Style & Naming Conventions
Follow the TypeScript ESLint configuration in `eslint.config.js`; favor 2-space indentation and trailing commas per the default formatter. Components and exported hooks use PascalCase (`CommandPalette.tsx`, `useKeyboard.ts`), while CSS assets remain kebab-case (`citadel.css`). Keep React code functional, colocate component-specific assets, and centralize reusable registry logic under `src/components/commands`.

## Testing Guidelines
Vitest with Testing Library powers unit and interaction coverage; place specs beside their implementations (`Citadel.test.tsx`). Use helpers in `src/__test-utils__/` for command registry scaffolding. Validate browser flows with Playwright specs in `tests/e2e` (e.g., `command-expansion.spec.ts`). Run `npm run coverage` before publishing to ensure regressions are caught early, and prefer descriptive test names that mirror the command being exercised.

## Commit & Pull Request Guidelines
Mirror the existing history that blends emoji prefixes with Conventional Commit semantics (`🧪 Fix…`, `feat:`). Keep commits focused on one logical change and include a rationale. Pull requests should outline motivation, implementation notes, and testing evidence (command logs, screenshots, or recordings when the console UI shifts). Link related issues and confirm linting and test runs in the description.

## Security & Configuration Tips
Command handlers can touch external systems—never hardcode credentials or tokens. Leverage environment-driven configuration and document any required variables in PRs. Review generated assets before publishing to ensure no sensitive data is bundled, and keep Playwright storage state or fixtures with secrets out of version control.
