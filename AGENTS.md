# AGENTS.md

This file provides guidance to AI coding agents working in this repository.
(`CLAUDE.md` is a symlink to this file.)

## What This Is

`citadel_cli` is a React component library published to npm. It provides a keyboard-driven command console (like a dev-tools terminal overlay) that can be embedded in web apps. Users trigger it with a configurable key (default: `.`), type hierarchical commands with auto-expansion, and see results rendered inline.

## Monorepo Layout

This is an npm-workspaces monorepo (root is a private orchestrator; run `npm`
scripts from the root and they delegate). See `CORE_EXTRACTION_DESIGN.md` for
the full extraction history.

```
packages/
  core/   @citadel/core  — framework-agnostic command engine (registry, DSL,
          results, parse, completion, controller). No React/DOM. Source of
          truth lives here; the React lib bundles it into its dist.
  react/  citadel_cli    — the published React library (components, hooks,
          config, Citadel.tsx, the demo app, e2e tests). Depends on @citadel/core.
  cli/    @citadel/cli   — terminal front-end (readline REPL) driving the same
          @citadel/core engine. Run `npm run coffee-bar` or `npm run game-master`.
```

**Path note:** paths in the Architecture section below that read
`src/components/Citadel/...` now live under `packages/react/src/components/Citadel/...`
(React) or, for the engine modules (command-registry, command-dsl, segment-stack,
results, completion, controller, parse-input, input-state, storage, help-command,
cursor, logger), under `packages/core/src/...`.

## Commands

```bash
npm run dev          # Start Vite dev server (demo app in src/App.tsx)
npm run preview      # Serve the production build locally
npm run build        # tsc + Vite library build + sync-package-artifacts → dist/
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm test             # Vitest unit tests (run once)
npm run test:e2e     # Playwright end-to-end tests
npm run test:e2e:ui  # Playwright with interactive UI
npm run coverage     # Vitest with coverage report
npm run verify:pack  # Verify dist/ package artifacts (CI runs this)
npm run docs:dev     # VitePress dev server for docs/
npm run docs:build   # Build docs site → docs/.vitepress/dist
npm run docs:preview # Serve the built docs site locally
npm run metrics:*    # Build/runtime metrics collection (see scripts/metrics/)
```

To run a single test file:
```bash
npx vitest --run src/components/Citadel/hooks/__tests__/useCommandParser.test.ts
```

**Node version:** `npm test` requires Node ≥22 — the test script sets
`NODE_OPTIONS=--no-experimental-webstorage`, a flag that does not exist on
older Node and fails with "not allowed in NODE_OPTIONS" (exit code 9).
`package.json` `engines` says `>=20`, but that applies to consumers, not
development.

**Git hooks:** `./scripts/install-git-hooks.sh` installs a pre-push hook that
runs the full test suite plus the library build (~30–45s), and a
pre-merge-commit hook that runs the same checks when merging into `main`.
There is no pre-commit hook — plain commits are instant.

## Releasing

Releases are tag-driven via GitHub Actions — no manual `npm publish`. The
published package is the `citadel_cli` workspace (`packages/react`); the repo
root is a private orchestrator and is never published. Bump the version in
`packages/react/package.json`, then tag and push:
```bash
npm version <patch|minor|major> -w citadel_cli   # bumps packages/react/package.json
git tag v<x.y.z> && git push && git push --tags    # triggers CI publish to npm
```
(`npm version -w` bumps the workspace package but does **not** create the git
tag, so tag manually to match `packages/react/package.json`.)

The Release workflow (`auto-publish.yml`) reuses `test.yml` as its test job, so
a red Tests workflow blocks publishing. It checks the tag against
`packages/react/package.json` and publishes with `npm publish -w citadel_cli`
(root scripts delegate `build`/`verify:pack` to that workspace). If a release
run fails, fix the cause on `main`, then re-point the tag
(`git tag -f v<x.y.z> <commit>` + force-push the tag) to re-trigger it.

## Architecture

### Library vs. Dev App

- **Library entry point**: `src/index.ts` — exports `Citadel`, `CommandRegistry`, the command DSL, `CitadelConfig`, and result types
- **Dev app**: `src/App.tsx` — Vite dev server demo, not included in the build
- **Build output**: `dist/citadel.es.js` and `dist/citadel.umd.cjs` (the `.cjs` is written by `scripts/sync-package-artifacts.mjs` after the Vite build). CSS is embedded in the JS and injected into the Shadow DOM — no separate stylesheet ships.

### Shadow DOM Isolation

The `Citadel` React component mounts a **Web Component** (`<citadel-element>`) that hosts a Shadow DOM. All React rendering happens inside that shadow root. CSS is injected as `CSSStyleSheet` via `adoptedStyleSheets`. This means Tailwind and component styles are fully isolated from the host app.

The stylesheet is imported as a raw string (`citadel.css?raw`) in `Citadel.tsx` and injected at mount time — no build plugin is involved.

### Defining Commands (the DSL)

The recommended authoring path is the typed DSL in
`src/components/Citadel/types/command-dsl.ts`:

```typescript
command('user.show')                       // dot-delimited hierarchical path
  .describe('Show user details')
  .arg('userId', (arg) => arg.describe('Enter user ID'))
  .handle(async ({ namedArgs }) => json({ id: namedArgs.userId }))
```

Build a registry with `createCommandRegistry(definitions)` and pass it to
`<Citadel>`. Result helpers: `text`, `json`, `image`, `error`, `bool`. The
legacy `CommandRegistry#addCommand` API still works but is not the preferred
path for new commands.

Trailing arguments can be marked optional, with an optional declared default
(e.g. `.arg('count', (arg) => arg.describe('…').optional({ default: '10' }))`);
the command then executes without them and the handler receives the default
(or `undefined` if none was declared). Required arguments may not follow
optional ones.

Command words auto-expand from the shortest unambiguous prefix, so prefer
sibling command words with distinct first letters (e.g. `users.filter` /
`users.sort` / `users.reset` → `u f` / `u s` / `u r`). Enum-like values are
better modeled as word segments than free-text arguments so they participate
in expansion (`users.filter.admin` → `u f a`).

### Data Flow

1. **`CommandRegistry`** — holds `CommandNode[]`, each with ordered `CommandSegment[]` (words + arguments), a description, and an async handler. Users build this externally (usually via the DSL) and pass it to `<Citadel>`.

2. **`CitadelConfigContext`** (`src/components/Citadel/config/CitadelConfigContext.tsx`) — React context wrapping the entire component tree inside the shadow DOM. Provides merged config, the command registry, storage, and a shared `SegmentStack`.

3. **`SegmentStack`** (`src/components/Citadel/types/segment-stack.ts`) — observer-pattern stack that tracks the user's current command path (e.g., `["user", "show"]`). Lives in context so all hooks share one instance.

4. **`useCommandParser`** (`src/components/Citadel/hooks/useCommandParser.ts`) — the central input-handling hook. Manages `InputState` (`idle` | `entering_command` | `entering_argument`), auto-expansion logic (`tryAutocomplete`), key event handling, and command execution dispatch. Also exports `parseInput`, which tokenizes argument input (quoting, completion state).

5. **`useCitadelState`** (`src/components/Citadel/hooks/useCitadelState.ts`) — manages output history (`OutputItem[]`), command execution with timeout, and history navigation.

### Display Modes

`CitadelRoot` (in `Citadel.tsx`) renders either:
- **`PanelController`** — slide-up overlay anchored to viewport bottom, toggleable via `showCitadelKey`. Supports drag-to-resize.
- **`InlineController`** — always-visible, fills its host container; sized via `initialHeight`/`maxHeight`/`minHeight` config. Useful for embedding in dashboards.

Both delegate to `CitadelTty` for the actual terminal UI.

### Command Result Types

Handlers must return one of these (all extend `CommandResult`):
- `TextCommandResult` — plain text
- `JsonCommandResult` — JSON tree
- `ImageCommandResult` — image display
- `BooleanCommandResult` — true/false with configurable display text (`bool(value, trueText, falseText)`)
- `ErrorCommandResult` — error styling

### Storage

Command history is persisted via `StorageFactory`, which returns either `LocalStorage` or `MemoryStorage` based on `config.storage.type`. The `HistoryService` and `useCommandHistory` hook manage navigation (arrow keys) and persistence.

### Styling (CSS)

- Prefer oklch for defining colors over HCL or RGB.

### Imports

Use relative imports within `src/` — no path alias is configured.

## Demo App (`src/App.tsx` + `src/examples/`)

The dev-server demo has five tabs, each backed by a registry in
`src/examples/`:

- **Basic** (`basicCommands.ts`) — result types, error handling, media output
- **Local Full-Stack** (`localDevCommands.ts`) — dev-overlay story; the `localstorage.*` commands operate on real browser state
- **DevOps** (`devopsCommands.ts`) — internal-tools story, simulated data
- **Spreadsheet** (`spreadsheetCommands.ts` + `spreadsheetDemo.ts`) — table-driving commands (`sort.*`, `filter.*`, `reset`) operating on a live team table; renders Citadel **inline** next to it with the output pane hidden (the table is the feedback)
- **Runtime Config** (`runtimeConfigCommands.ts` + `runtimeConfigDemo.ts`) — commands that reconfigure Citadel live

Pattern: examples that only return data are plain registry factories. Examples
whose commands mutate page or config state pair a `use<Name>Demo()` hook
(owns the React state, builds the registry via `useMemo`) with a
`create<Name>CommandDefinitions(actions)` factory. Follow this pattern when
adding stateful examples, and mock the hook in `App.test.tsx`.

## Repository Skills

### citadel-browser-screenshots

- **Skill path**: `skills/citadel-browser-screenshots/SKILL.md`
- **Use when**: You need deterministic browser screenshots of Citadel behavior (command expansion, suggestions, output, inline/panel UI).
- **Script**: `skills/citadel-browser-screenshots/scripts/capture_citadel_screenshot.mjs`
- **Sequence reference**: `skills/citadel-browser-screenshots/references/citadel_sequences.md`

Example:
```bash
node skills/citadel-browser-screenshots/scripts/capture_citadel_screenshot.mjs \
  --url http://localhost:5173 \
  --tab "Basic" \
  --keys "u s 1234 Enter" \
  --out test-results/screenshots/citadel-basic.png \
  --clip-citadel
```

Gotchas:
- Use `localhost`, not `127.0.0.1` — the Vite dev server binds IPv6 (`::1`)
  only, so `127.0.0.1` is refused. Read the actual port from Vite's startup
  output; it increments past 5173 when the port is busy.
- Key tokens are typed back-to-back with no separator. Multi-argument commands
  need an explicit `Space` token between argument values
  (e.g. `"loc s demo.theme Space dark Enter"`).
- Omit `--clip-citadel` to capture the whole page (e.g. to verify on-page
  effects like the Spreadsheet table).
