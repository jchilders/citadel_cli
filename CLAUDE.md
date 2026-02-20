# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`citadel_cli` is a React component library published to npm. It provides a keyboard-driven command console (like a dev-tools terminal overlay) that can be embedded in web apps. Users trigger it with a configurable key (default: `.`), type hierarchical commands with auto-expansion, and see results rendered inline.

## Commands

```bash
npm run dev          # Start Vite dev server (demo app in src/App.tsx)
npm run build        # TypeScript compile + Vite library build → dist/
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm test             # Vitest unit tests (run once)
npm run test:e2e     # Playwright end-to-end tests
npm run coverage     # Vitest with coverage report
```

To run a single test file:
```bash
npx vitest --run src/components/Citadel/hooks/__tests__/useCommandParser.test.ts
```

**Note:** A pre-commit hook runs the full test suite before every commit. This takes ~10–15 seconds.

## Releasing

Releases are tag-driven via GitHub Actions — no manual `npm publish`:
```bash
npm version <patch|minor|major>   # bumps package.json + creates git tag
git push && git push --tags        # triggers CI publish to npm
```

## Architecture

### Library vs. Dev App

- **Library entry point**: `src/index.ts` — exports `Citadel`, `CommandRegistry`, `CitadelConfig`, and result types
- **Dev app**: `src/App.tsx` — Vite dev server demo, not included in the build
- **Build output**: `dist/citadel.es.js` and `dist/citadel.umd.cjs`, plus `dist/citadel.css`

### Shadow DOM Isolation

The `Citadel` React component mounts a **Web Component** (`<citadel-element>`) that hosts a Shadow DOM. All React rendering happens inside that shadow root. CSS is injected as `CSSStyleSheet` via `adoptedStyleSheets`. This means Tailwind and component styles are fully isolated from the host app.

The custom Vite plugin `plugins/vite-shadow-dom.ts` handles CSS-in-JS bundling for this pattern.

### Data Flow

1. **`CommandRegistry`** — holds `CommandNode[]`, each with ordered `CommandSegment[]` (words + arguments), a description, and an async handler. Users build this externally and pass it to `<Citadel>`.

2. **`CitadelConfigContext`** (`src/components/Citadel/config/CitadelConfigContext.tsx`) — React context wrapping the entire component tree inside the shadow DOM. Provides merged config, the command registry, storage, and a shared `SegmentStack`.

3. **`SegmentStack`** (`src/components/Citadel/types/segment-stack.ts`) — observer-pattern stack that tracks the user's current command path (e.g., `["user", "show"]`). Lives in context so all hooks share one instance.

4. **`useCommandParser`** (`src/components/Citadel/hooks/useCommandParser.ts`) — the central input-handling hook. Manages `InputState` (`idle` | `entering_command` | `entering_argument`), auto-expansion logic (`tryAutocomplete`), key event handling, and command execution dispatch.

5. **`useCitadelState`** (`src/components/Citadel/hooks/useCitadelState.ts`) — manages output history (`OutputItem[]`), command execution with timeout, and history navigation.

### Display Modes

`CitadelRoot` renders either:
- **`PanelController`** — slide-up overlay anchored to viewport bottom, toggleable via `showCitadelKey`. Supports drag-to-resize.
- **`InlineController`** — always-visible, fills its host container. Useful for embedding in dashboards.

Both delegate to `CitadelTty` for the actual terminal UI.

### Command Result Types

Handlers must return one of these (all extend `CommandResult`):
- `TextCommandResult` — plain text
- `JsonCommandResult` — JSON tree
- `ImageCommandResult` — image display
- `ErrorCommandResult` — error styling

### Storage

Command history is persisted via `StorageFactory`, which returns either `LocalStorage` or `MemoryStorage` based on `config.storage.type`. The `HistoryService` and `useCommandHistory` hook manage navigation (arrow keys) and persistence.

### Path Alias

`tsconfig.app.json` configures `@/` as an alias for `src/`. Use `@/components/...` for imports within the library source.
