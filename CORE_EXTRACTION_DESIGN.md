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

**Refactor A — split result data from rendering.** Core result types become
plain data (discriminated union, no `render()`):

```ts
// core/results.ts
type CommandResult =
  | { kind: 'text'; value: string }
  | { kind: 'json'; value: unknown }
  | { kind: 'bool'; value: boolean; trueText: string; falseText: string }
  | { kind: 'image'; url: string; altText: string }
  | { kind: 'error'; error: string }
```

The `text`/`json`/`bool`/`image`/`error` helpers in `command-dsl.ts` build these
plain objects. Rendering moves to each adapter: `react/renderResult.tsx` switches
on `kind` → JSX; `cli/renderResult.ts` switches on `kind` → formatted string
(`json` → colorized `JSON.stringify`, `image` → terminal image escape or
`[image: url]` fallback).

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

```ts
// core/controller.ts
type ParserState = {
  path: CommandSegment[]; currentInput: string;
  inputState: InputState; historyPosition: number | null
}

type Effect =
  | { kind: 'setInput'; value: string }
  | { kind: 'pushSegment'; segment: CommandSegment }
  | { kind: 'popSegment' } | { kind: 'clearStack' }
  | { kind: 'execute' }
  | { kind: 'addHistory'; segments: CommandSegment[] }
  | { kind: 'invalidInput' }              // web: shake animation; cli: terminal bell
  | { kind: 'historyNav'; dir: 'up' | 'down' }

reduceInputChange(state, newValue, registry): Effect[]
reduceKey(state, key: AbstractKey, registry): Effect[]
```

`AbstractKey` removes the DOM dependency:

```ts
type AbstractKey =
  | { name: 'Enter' | 'Backspace' | 'ArrowUp' | 'ArrowDown' | 'Escape' | 'Delete' }
  | { name: 'char'; char: string }
```

Web maps `KeyboardEvent`→`AbstractKey` and derives the `preventDefault` decision
from the returned effects (current `return false` cases at lines 287, 334 become
an `invalidInput` effect). CLI maps a readline `keypress`→`AbstractKey`. The
`async` history branches (lines 300–326) become a `historyNav` effect the adapter
resolves against its own `HistoryService`.

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

### Step 2 — Split result data from rendering
- [ ] Define plain-data `CommandResult` union in `core/results.ts`
- [ ] Repoint `text`/`json`/`bool`/`image`/`error` DSL helpers at the plain objects
- [ ] Add `react/renderResult.tsx` (switch on `kind` → JSX); remove `render()`
      from the result classes / replace classes with the union
- [ ] `npm test` green (esp. `command-dsl.test.ts`)

### Step 3 — Introduce the controller reducer
- [ ] Define `ParserState`, `Effect`, `AbstractKey` in `core/controller.ts`
- [ ] Port `handleInputChange` → `reduceInputChange(state, newValue, registry): Effect[]`
- [ ] Port `handleKeyDown` → `reduceKey(state, key, registry): Effect[]`
      (history branches → `historyNav` effect; `return false` → `invalidInput`)
- [ ] Add `applyEffect` interpreter in `useCommandParser`; delegate to the reducers
- [ ] `npm test` + `npm run test:e2e` green

### Step 4 — Carve the workspace
- [ ] Set up npm/pnpm workspaces: `packages/core`, `packages/react`, `packages/cli`
- [ ] `core` depends on nothing; `react` + `cli` depend on `core`
- [ ] `src/index.ts` re-exports from `@citadel/react` for npm back-compat
- [ ] `npm run build` + `npm run verify:pack` green

### Step 5 — CLI adapter
- [ ] `cli/renderResult.ts` (union → formatted string)
- [ ] readline/Ink loop: keypress → `AbstractKey` → `reduceKey` → `applyEffect`
- [ ] FileStorage-backed `CommandStorage` impl for history
- [ ] Smoke test: run a registry's commands end-to-end in the terminal

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
