# @citadel/cli

A terminal front-end for [Citadel](../../README.md). It drives the **same**
`@citadel/core` command engine that powers the web `<Citadel>` component — the
prefix auto-expansion, hierarchical commands, argument parsing, and history are
all shared. No React, no DOM; just a readline REPL.

## Try it

```bash
npm run coffee-bar      # coffee-bar demo (src/demo.ts)
npm run game-master     # game-master console (examples/dungeon-console.ts)
```
(Run from the repo root — the root scripts delegate to this workspace. Or add
`-w @citadel/cli` to run from anywhere.)

In the REPL, type the shortest unambiguous prefix and it expands as you go:

```
citadel❯ r d 20 ⏎        roll.dice 20      → 🎲 d20 → 14
citadel❯ r c ⏎           roll.coin         → 🪙 Heads
citadel❯ l a "Trap!" ⏎   log.add           → 📜 Logged entry #1.
citadel❯ c a Aragorn ⏎   crew.add          → ⚔️  Aragorn joins the party!
citadel❯ c r ⏎           crew.roster       → { "size": 1, "members": ["Aragorn"] }
```

Quote multi-word argument values (`"Goblin ambush"`). `Backspace` on an empty
line steps back up the command path; `↑`/`↓` recall history.

## Build your own

A CLI is just a command registry handed to `runCli`:

```ts
import { command, createCommandRegistry, text } from '@citadel/core';
import { runCli } from '@citadel/cli';

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
  `useCommandParser` hook. Feeds keystrokes through the shared
  `reduceKey` / `reduceInputChange` core reducers and interprets the effects.
- `src/render-result.ts` — renders a `CommandResult` to a string (the web has
  its own JSX renderer).
- `src/repl.ts` — the interactive readline loop; `src/run.ts` — the
  REPL-or-`--script` entry helper.
