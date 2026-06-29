# @citadel_cli/cli

A terminal front-end for [Citadel](../../README.md). It drives the **same**
`@citadel_cli/core` command engine that powers the web `<Citadel>` component — the
prefix auto-expansion, hierarchical commands, argument parsing, and history are
all shared. The interactive UI is a full-screen [Ink](https://github.com/vadimdemedes/ink)
TUI that mirrors the web's three regions: an output pane in its own bordered box
(newest at the bottom, older scrolls off the top), with the command line and the
suggestion list pinned beneath it. Async command results land in the output pane
(with a spinner while running), never inline with your input.

## Try it

```bash
npm run cli:coffee-bar      # coffee-bar demo (src/demo.ts)
npm run cli:game-master     # game-master console (examples/dungeon-console.ts)
npm run cli:basic       # the web demo's "Basic" example, in the terminal
npm run cli:devops      # the web demo's "DevOps" example, in the terminal
```

`basic-cli` and `devops-cli` import the **exact same** registry files the web
demo uses (`@citadel_cli/sample-commands`) — one definition, two front-ends.
(Run from the repo root — the root scripts delegate to this workspace. Or add
`-w @citadel_cli/cli` to run from anywhere.)

In the TUI, type the shortest unambiguous prefix and it expands as you go:

```
citadel❯ r d 20 ⏎        roll.dice 20      → 🎲 d20 → 14
citadel❯ r c ⏎           roll.coin         → 🪙 Heads
citadel❯ l a "Trap!" ⏎   log.add           → 📜 Logged entry #1.
citadel❯ c a Aragorn ⏎   crew.add          → ⚔️  Aragorn joins the party!
citadel❯ c r ⏎           crew.roster       → { "size": 1, "members": ["Aragorn"] }
```

Quote multi-word argument values (`"Goblin ambush"`). `Backspace` on an empty
line steps back up the command path; `↑`/`↓` recall history; `Shift`+`↑`/`↓` (or
`PageUp`/`PageDown`) scroll back through the output pane (any keystroke snaps
back to the newest).

## Build your own

Install the engine and the terminal front-end (both published to npm):

```bash
npm install @citadel_cli/cli @citadel_cli/core
```

`@citadel_cli/cli` brings `ink` and `react` with it. It ships ESM only (`"type":
"module"`) with a self-contained `dist/index.d.ts`, so it resolves cleanly under
`NodeNext`/`Node16` as well as bundler resolution. Author your commands with the
`@citadel_cli/core` DSL and hand the registry to `runCli`:

```ts
import { command, createCommandRegistry, text } from '@citadel_cli/core';
import { runCli } from '@citadel_cli/cli';

runCli(
  createCommandRegistry([
    command('ping').describe('Health check').handle(async () => text('pong')),
  ]),
  { welcome: 'Welcome to my console — Ctrl+C to quit.' }, // per-app startup banner
);
```

See [`examples/dungeon-console.ts`](./examples/dungeon-console.ts) for a fuller,
commented example (stateful commands, optional args, `text`/`json`/`bool`
results).

`runCli` auto-registers a `help` command that lists every command (with its
auto-expand shortcuts), matching the web. Pass `{ includeHelpCommand: false }`
to suppress it, or define your own `help` command to override it.

### Streaming output (`tail -f`)

A handler can return a live, append-only stream instead of a single result. The
`stream` helper hands your producer a handle to `push` lines over time, and you
return an optional cleanup function:

```ts
import { command, stream } from '@citadel_cli/core';

command('logs.tail').describe('Stream logs').handle(() =>
  stream((s) => {
    const id = setInterval(() => s.push(nextLogLine()), 600);
    return () => clearInterval(id); // runs on Ctrl+C / close
  }, { maxLines: 500 }) // optional scrollback cap (default 500)
);
```

The output pane renders lines as they arrive with a live `◉` marker. **Ctrl+C**
stops the active stream(s); it only quits the app when nothing is streaming. The
same definition drives the web component, where a **⏹ Stop** button ends it.

## Scripted mode (demos / CI)

`runCli` also takes a non-interactive `--script` where characters are typed and
`\n` presses Enter — handy for tests and docs:

```bash
# Invoke the file directly — `npm run` intercepts the --script flag name.
npx tsx examples/dungeon-console.ts --script=$'rc\nls\n'
# roll coin → 🪙 Tails
# log show  → { "entries": [] }
```

## How it fits together

- `src/session.ts` — `CliSession`, the terminal counterpart of the web's
  `useCommandParser` + `useCitadelState` hooks. Feeds keystrokes through the
  shared `reduceKey` / `reduceInputChange` core reducers, interprets the
  effects, and runs commands with the same pending→resolve output lifecycle
  (an `onChange` callback lets the TUI re-render).
- `src/tui.tsx` — the full-screen Ink TUI (alternate screen): a bordered
  output `<Box>` (`flexGrow` + `justifyContent="flex-end"` + `overflow="hidden"`
  to keep the newest output in view), with the command line and suggestions
  pinned below — mapping the web's CitadelTty/CommandOutput/CommandInput/
  AvailableCommands. `useInput` → `AbstractKey` → the same core reducers.
- `src/render-result.ts` — renders a `CommandResult` to a string (the web has
  its own JSX renderer).
- `src/run.ts` — the TUI-or-`--script` entry helper.
