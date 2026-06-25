# Core Extraction Design: Framework-Agnostic Command Engine

**Status:** Proposed
**Author:** James Childers
**Date:** 2026-06-24

## Goal

Extract Citadel's command-completion brain into a framework-agnostic core so the
same parsing, expansion, and execution logic runs both on the web (React, today's
product) and in a terminal CLI. No behavior change for existing consumers.

## Non-goal: WASM

The shared artifact is **plain TypeScript that Node runs natively in the
terminal** — there is no WASM anywhere in this design. WASM only earns its keep
when the shared logic lives in a non-JS language (Rust/Go/C) that must run in
both a browser and a native host. Citadel's core is already TS, and the CLI
target runs on Node/Bun/Deno, so compiling to WASM would add an FFI boundary and
a string-marshalling tax (painful for a string-heavy parser) while buying
nothing. Revisit only if the core is ever rewritten in another language or must
embed in a non-JS host.

## Current state

The completion logic is already ~95% framework-agnostic. These files have **zero**
React/DOM coupling and move to core nearly as-is:

- `command-registry.ts`, `command-dsl.ts`, `command-prefix.ts`
- `segment-stack.ts`, `cursor.ts`, `help-command.ts`
- `parseInput` + `stripSurroundingQuotes` (currently inline in
  `useCommandParser.ts:370-431`, already exported free functions)
- `inputStateReducer` + `InputState` (`useCommandParser.ts:9-24`)

Two real entanglements remain:

1. **`command-results.tsx` braids result *data* with React rendering** — each
   result class carries an `abstract render(): React.ReactNode` (lines 33, 44, 61,
   78, 96, 116). Handlers return objects that know how to render themselves as JSX.
2. **`useCommandParser` braids three concerns** that look like one:
   - *Pure completion queries* — `getAutocompleteSuggestion`,
     `getNextExpectedSegment`, `getAvailableNodes`, `findMatchingCommands`,
     `isValidCommandInput`. Each closes over `commands` + `segmentStack` but is
     otherwise a pure function of `(registry, path, input)`.
   - *The controller* — `handleInputChange`, `handleKeyDown`. Imperatively mutate
     `segmentStack`, call `actions`, dispatch input-state. The shareable brain,
     but tangled with a DOM `KeyboardEvent` and `e.preventDefault()`.
   - *React glue* — `useReducer`, hook deps on `useCitadelState`/`useCommandHistory`.

## Target layout

```
packages/
  core/      ← zero deps on react/dom. The brain.
  react/     ← today's components; thin wrapper over core
  cli/       ← readline (or Ink) adapter over the same core
```

`src/index.ts` re-exports from `@citadel/react` so the published npm package keeps
its current surface.

## Design

### `@citadel/core`

**Moves nearly as-is** (drop the `Logger` import or make it injectable):
the registry, DSL, prefix, segment-stack, cursor, help-command modules;
`parseInput`/`stripSurroundingQuotes` → `core/parse-input.ts`;
`inputStateReducer`/`InputState` → `core/input-state.ts`; the `CommandStorage`
interface + `MemoryStorage` impl (`LocalStorage` stays in the react package).

**Refactor A — split result data from rendering.** *(Implemented; deviates from
the original plain-union sketch — see note.)* Core keeps the `CommandResult`
class hierarchy but strips React out of it:

- `core/results.ts` holds `CommandStatus`, the abstract `CommandResult` base
  (status machinery + `timestamp`, **no** `render()`), and the built-in data
  classes (`Text`/`Json`/`Boolean`/`Error`/`Pending`/`Image`CommandResult) with
  their fields/constructors but **no** `render()`. Zero React import.
- `types/command-results.ts` is now a back-compat re-export of `core/results`
  (renamed from `.tsx`; ~15 importers unchanged).
- `components/renderResult.tsx` (web adapter) renders a `CommandResult` to JSX:
  `instanceof` each built-in → JSX. The CLI adapter will add its own
  `cli/renderResult.ts` (→ formatted string; `json` → colorized
  `JSON.stringify`, `image` → terminal image escape or `[image: url]` fallback).
- The `text`/`json`/`bool`/`image`/`error` DSL helpers are unchanged — they
  already build these classes, which are now React-free.

> **Why not a plain discriminated union?** `render()` is a *public extension
> seam*: `CommandResult` is exported from the package root, and consumers (incl.
> the repo's own `examples/starshipResults.tsx`, `examples/hackingSimVictory.tsx`)
> subclass it with a custom `render()` returning arbitrary React. A union would
> break that seam and the "no behavior change" rule. Instead, `render()` is no
> longer `abstract` on the base; `renderResult()` handles built-ins by type and
> **falls back to `result.render()` for any custom subclass that defines one** —
> preserving the seam. The classes also carry mutable execution status
> (`markSuccess`/`markFailure`/`markTimeout`, used by `useCitadelState` and
> `instanceof CommandResult` validation), which a plain union would have
> displaced into a wrapper. Minor caveat: external code calling `.render()`
> directly on a *built-in* result (undocumented) would need to call
> `renderResult()` instead.

**Refactor B — completion queries as free functions.** Extracted verbatim from
the `useCallback` bodies (`useCommandParser.ts:37-117`), with `commands`→`registry`
and `segmentStack.path()`→`path` params, no logic change:

```ts
// core/completion.ts
getAutocompleteSuggestion(registry, path, input): CommandSegment
getNextExpectedSegment(registry, path): CommandSegment
getAvailableNodes(registry, path): CommandNode[]
findMatchingCommands(registry, path, input, nodes): CommandNode[]
isValidCommandInput(registry, path, input): boolean
```

**Refactor C — the controller as a pure reducer returning effects.** The only
real design work. Re-express `handleInputChange`/`handleKeyDown` so they *return
intents* instead of mutating + calling actions:

*(Implemented; the as-built shapes differ slightly from this sketch — see note.)*

```ts
// core/controller.ts (as built)
interface ParserState {
  stack: CommandSegment[];   // full segment stack, not just names — the reducer
  currentInput: string;      // simulates the arg push to make Enter decisions
  inputState: InputState;
  isEnteringArg: boolean;
  historyPosition: number | null;
}

type Effect =
  | { kind: 'setInput'; value: string }
  | { kind: 'setInputState'; state: InputState }
  | { kind: 'commitArgument'; value: string }   // set next-expected arg's value & push
  | { kind: 'pushSegment'; segment: CommandSegment }
  | { kind: 'popSegment' }
  | { kind: 'execute' }
  | { kind: 'addHistory' }
  | { kind: 'resetInput' }                        // clear input/flag/stack → idle
  | { kind: 'historyNav'; dir: 'up' | 'down' }

reduceInputChange(state, newValue, registry): Effect[]
reduceKey(state, key: AbstractKey, registry): KeyDecision
```

> **Deviation from the sketch.** `reduceKey` returns a `KeyDecision`
> (`{ effects, preventDefault, valid }`), not a bare `Effect[]` — the key handler
> genuinely needs to signal `preventDefault` and validity (`valid: false` drives
> the shake animation), which don't map cleanly to effects. `reduceInputChange`
> does return `Effect[]`. `ParserState.stack` holds full `CommandSegment[]` (not
> just names) because Enter commits a pending argument *before* resolving the
> command, so the reducer simulates that push to decide command-exists /
> required-args. Effects also include `commitArgument`, `resetInput`, and
> `setInputState` (vs. the sketch's `clearStack`/`invalidInput`) to mirror the
> original mutate-then-read ordering exactly.

`AbstractKey` removes the DOM dependency:

```ts
type AbstractKey =
  | { name: 'Backspace' | 'Enter' | 'ArrowUp' | 'ArrowDown' }
  | { name: 'char'; char: string }
  | { name: 'other' }   // any other key → no-op (arrows L/R, Escape, modifiers…)
```

Web maps `KeyboardEvent`→`AbstractKey` (`toAbstractKey`) and applies
`decision.preventDefault` / `decision.valid` directly. CLI maps a readline
`keypress`→`AbstractKey`. The `async` history branches become a `historyNav`
effect the adapter resolves against its own `HistoryService` (the web adapter
detects it and returns a `Promise<boolean>`).

### `@citadel/react` — thin wrapper

`useCommandParser` shrinks to: hold `inputState` via `useReducer`, call
`reduceKey`/`reduceInputChange`, then interpret the effect list against the
existing `segmentStack`/`actions`/`history` (a ~40-line `applyEffect` switch).
Components, Shadow DOM, CSS injection, and `renderResult.tsx` stay here. Net:
loses ~250 lines of logic to core, gains a small interpreter.

### `@citadel/cli` — new adapter

```ts
const registry = createCommandRegistry(defs)
let state = initialParserState()
readline keypress → toAbstractKey → reduceKey(state, key, registry)
  → applyEffect over a plain in-memory stack + FileStorage history
  → on 'execute': await registry.getCommand(path).handler(...) → cli/renderResult → stdout
```

Raw `readline` for a plain prompt, or **Ink** to mirror the web's live suggestion
list / expansion preview. Imports *only* `@citadel/core`.

## Migration checklist

Each step keeps tests green. Steps 1–2 are pure lift-and-shift (low risk,
independent). Step 3 is the one that needs the e2e tests as a safety net.

### Step 1 — Extract pure modules (no behavior change) ✅
- [x] Move `parseInput` + `stripSurroundingQuotes` out of `useCommandParser.ts`
      into a new `core/parse-input.ts` module; re-export from `useCommandParser`
      for existing consumers (`CommandInput.tsx`, tests)
- [x] Move `inputStateReducer` + `InputState` into `core/input-state.ts`;
      re-import in `useCommandParser`
- [x] Extract the five completion queries into `core/completion.ts` as free
      functions `(registry, path, input)`; the `useCallback` wrappers now
      delegate to them. The null sentinel is injected so identity-based tests
      (`getAutocompleteSuggestion` → `toBe(nullSegment)`) keep passing.
- [x] `npm test` green (230 passed / 7 skipped, 28 files); `tsc --noEmit` and
      `eslint` clean on the new modules + rewired hook

> Note: core modules currently live at `src/components/Citadel/core/`; Step 4
> moves that directory to `packages/core/`.

### Step 2 — Split result data from rendering ✅
- [x] Move `CommandStatus` + `CommandResult` hierarchy into `core/results.ts`,
      React-free, with `render()` removed from the base + built-in classes
      (kept the class hierarchy rather than a plain union — see Refactor A note)
- [x] `types/command-results` → back-compat re-export of `core/results`
      (renamed `.tsx` → `.ts`); DSL helpers unchanged (already build these classes)
- [x] Add `components/renderResult.tsx` (`instanceof` built-ins → JSX, with a
      custom-subclass `render()` fallback seam); repoint the two `.render()` call
      sites (`CommandOutput.tsx`, `command-dsl.test.ts`) at it
- [x] `npm test` green (230 passed / 7 skipped); `tsc`, `eslint`, and
      `npm run build` clean

### Step 3 — Introduce the controller reducer ✅
- [x] Define `ParserState`, `Effect`, `AbstractKey`, `KeyDecision` in
      `core/controller.ts` (React-free)
- [x] Port `handleInputChange` → `reduceInputChange(state, newValue, registry): Effect[]`
- [x] Port `handleKeyDown` → `reduceKey(state, key, registry): KeyDecision`
      (history branches → `historyNav` effect; `return false` → `valid: false`)
- [x] Add `applyEffects` interpreter + `snapshot` + `toAbstractKey` in
      `useCommandParser`; the hook handlers now delegate to the reducers
- [x] Added `core/__tests__/controller.test.ts` (22 tests) covering the reducer
      directly — including history nav + Backspace-pop, which the hook tests
      never exercised
- [x] `npm test` green (252 passed / 7 skipped, 29 files); `npm run test:e2e`
      green (10/10 chromium); `tsc`, `eslint`, `npm run build` clean

### Step 4 — Carve the workspace (in progress)

**Phase 4.1 — `@citadel/core` package ✅**
- [x] Add root `workspaces: ["packages/*"]`; create `packages/core` (`@citadel/core`,
      exports TS source via `./src/index.ts`)
- [x] `git mv` the 13 React-free engine files (registry, dsl, prefix,
      segment-stack, storage, help-command, cursor, results, input-state,
      parse-input, completion, controller) + `logger` into `packages/core/src`;
      drop the `command-results` shim
- [x] Rewire ~60 importers across `src/` to `@citadel/core`; `types/index.ts`
      re-exports `@citadel/core` (deliberate additive widening — core is now a
      public reusable surface); `state.ts` stays React-side
- [x] `vitest.workspace.ts` adds a node-env `core` project (the npm `workspaces`
      field makes vitest ignore the root `test.include`)
- [x] Published types stay self-contained: alias `@citadel/core` → its source so
      Vite bundles the engine into the JS **and** vite-plugin-dts rewrites
      emitted `.d.ts` imports to relative paths within `dist/` (api-extractor
      `rollupTypes`/`bundledPackages` was tried first but hit an internal
      "Unable to follow symbol" crash — the alias approach avoids it entirely)
- [x] `tsc`, `npm test` (252), `npm run lint` (0 errors), `npm run build`,
      `npm run verify:pack` all green

**Phase 4.2 — relocate React lib to `packages/react` ✅**
- [x] `git mv` `src/`, `tests/`, `index.html`, `vite.config.ts`,
      `vite.demo.config.ts`, `playwright.config.ts`, `tsconfig.app.json` →
      `tsconfig.json`, and the `sync`/`verify` artifact scripts into
      `packages/react/`; delete the dead `vitest.config.ts` + orphaned
      `tsconfig.node.json`
- [x] `packages/react/package.json` is the published `citadel_cli` (publish
      config, `peerDependencies` react, `@citadel/core` as a build-time devDep —
      it's bundled into dist, not a runtime dep)
- [x] Root `package.json` → private orchestrator (`citadel-cli-monorepo`) whose
      scripts **delegate** (`build`/`verify:pack`/`dev`/`build:demo`/`test:e2e`
      → `-w citadel_cli`); `test`/`lint`/`docs`/`metrics` stay at root. CI
      workflows call the same root scripts, so they keep working unchanged.
- [x] Path fixups: vite.config `@citadel/core` alias → `../core/src`;
      `vitest.workspace.ts` → `./packages/react/vite.config.ts`; root
      `tsconfig.json` covers `packages/*/src` for the husky typecheck;
      `eslint.config.js` globs → `packages/react/src` + `**/dist`
- [x] Release-pipeline edits (the one part not runnable locally):
      `auto-publish.yml` publishes `-w citadel_cli` and checks the tag against
      `packages/react/package.json`; `deploy-pages.yml` points at
      `packages/react/dist-demo`; `AGENTS.md` Releasing + Monorepo Layout updated
- [x] Verified from root: `tsc`, `npm test` (259, 30 files), `lint` (0 errors),
      `build`, `verify:pack`, `build:demo`, e2e (10/10 chromium), CLI demo — all
      green

> Caveat: the actual `npm publish` step can't be exercised without a real
> release. The workflow change is the standard npm-workspaces form
> (`npm publish -w <pkg>` from a private root); review before the next tag.

**Phase 4.3 — `packages/cli` adapter ✅** *(= Step 5; the web+terminal payoff)*
- [x] `packages/cli` (`@citadel/cli`, depends on `@citadel/core`)
- [x] `render-result.ts` — `CommandResult` → string (the CLI's `renderResult`,
      with the same custom-subclass `render()` fallback seam as the web)
- [x] `session.ts` — `CliSession`, the terminal counterpart of `useCommandParser`:
      owns a `SegmentStack` + parser state, feeds keystrokes through the **same**
      `reduceKey`/`reduceInputChange` reducers, interprets the effects, and runs
      handlers (replicating `executeCommand` incl. optional-arg defaults). Also
      replicates `CommandInput`'s `entering_argument` sync.
- [x] `repl.ts` — interactive readline loop (keypress → `AbstractKey` →
      session); `demo.ts` — runnable entry with a non-interactive `--script`
      mode; `demo-registry.ts` — a playful coffee-themed registry
- [x] `packages/cli/src/__tests__/session.test.ts` (7 tests) drives the session
      keystroke-by-keystroke: auto-expansion, word→arg commit, quoted args,
      invalid-char rejection, Backspace-pop, error rendering, ArrowUp recall
- [x] `vitest.workspace.ts` adds a node-env `cli` project; `tsx` (dev dep) runs
      the REPL; `npm run coffee-bar` / `npm run game-master` launch it
- [x] **Fixed a core bundler-ism:** `logger.ts` used Vite's `import.meta.env.PROD`,
      which crashes under plain Node/the CLI — now guarded (falls back to
      `NODE_ENV`) so `@citadel/core` is genuinely bundler-agnostic
- [x] `tsc`, `npm test` (259, 30 files), `lint` (0 errors), `build`,
      `verify:pack` all green; `--script` demo runs end-to-end under Node

> Pre-existing engine nuance confirmed (not changed): pressing Enter while
> `inputState === 'entering_argument'` with an empty buffer commits an empty
> argument rather than applying a trailing optional arg's default. The CLI
> reproduces the web faithfully; the demo registry models choices as word
> segments to sidestep it.

## Risks / open questions

- **e2e coverage is the safety net for Step 3.** Confirm the Playwright suite
  exercises expansion, argument entry (quoted + unquoted), Enter execution,
  history nav, and invalid-input animation before refactoring the controller.
- **`Logger` injection** — decide whether core takes a logger param or core stays
  silent and adapters log.
- **Image results in the terminal** — pick a strategy (iTerm2/kitty escape vs.
  plaintext fallback) or defer to a later milestone.
- **Ink vs. raw readline** — affects how much of the live-suggestion UI the CLI
  mirrors; can start with readline and upgrade.
