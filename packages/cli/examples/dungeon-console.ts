/**
 * Example CLI: a tabletop game-master console, built on @citadel/core.
 *
 * The whole app is a command registry (the DSL) handed to `runCli`. The same
 * engine powers the web `<Citadel>` component — here it runs in the terminal.
 * This file is meant to be read top-to-bottom as a template for your own CLI.
 *
 * Run it:
 *   npm run game-master                              # interactive REPL (from repo root)
 *   npx tsx examples/dungeon-console.ts --script=$'rc\\nls\\n'  # scripted
 *
 * In the REPL, type the shortest unambiguous prefix and it auto-expands:
 *   `r d 20 ⏎`        → roll.dice 20
 *   `r c ⏎`           → roll.coin
 *   `l a "Trap!" ⏎`   → log.add  (quote multi-word arguments)
 *   `c a Aragorn ⏎`   → crew.add
 *   `c r ⏎`           → crew.roster
 */
import { bool, command, createCommandRegistry, json, text, CommandRegistry } from '@citadel/core';
import { runCli } from '../src/run';

function buildConsole(): CommandRegistry {
  // In-memory campaign state the commands read and mutate. A real CLI might
  // back this with a file or a database; the engine doesn't care.
  const log: string[] = [];
  const crew: string[] = [];

  // A tiny dice helper. (Randomness lives in handlers, never in the engine.)
  const d = (sides: number) => 1 + Math.floor(Math.random() * sides);

  return createCommandRegistry([
    // --- roll: dice + coin ----------------------------------------------------
    command('roll.dice')
      .describe('Roll an N-sided die')
      .arg('sides', (arg) => arg.describe('Number of sides').optional({ default: '20' }))
      .handle(async ({ namedArgs }) => {
        const sides = Math.max(2, Number(namedArgs.sides) || 20);
        return text(`🎲 d${sides} → ${d(sides)}`);
      }),
    command('roll.coin')
      .describe('Flip a coin')
      .handle(async () => bool(Math.random() < 0.5, '🪙 Heads', '🪙 Tails')),

    // --- log: the campaign journal (stateful) --------------------------------
    command('log.add')
      .describe('Add a journal entry')
      .arg('entry', (arg) => arg.describe('What happened (quote if it has spaces)'))
      .handle(async ({ namedArgs }) => {
        log.push(namedArgs.entry ?? '');
        return text(`📜 Logged entry #${log.length}.`);
      }),
    command('log.show')
      .describe('Show the journal')
      .handle(async () => json({ entries: log })),
    command('log.clear')
      .describe('Wipe the journal')
      .handle(async () => {
        const n = log.length;
        log.length = 0;
        return text(`🧹 Cleared ${n} ${n === 1 ? 'entry' : 'entries'}.`);
      }),

    // --- crew: the party roster (stateful) -----------------------------------
    command('crew.add')
      .describe('Recruit an adventurer')
      .arg('name', (arg) => arg.describe('Character name'))
      .handle(async ({ namedArgs }) => {
        crew.push(namedArgs.name ?? '');
        return text(`⚔️  ${namedArgs.name} joins the party!`);
      }),
    command('crew.roster')
      .describe('List the party')
      .handle(async () => json({ size: crew.length, members: crew })),

    // --- echo / ping ----------------------------------------------------------
    command('echo')
      .describe('Echo a message')
      .arg('message', (arg) => arg.describe('Anything'))
      .handle(async ({ namedArgs }) => text(namedArgs.message ?? '')),
    command('ping')
      .describe('Health check')
      .handle(async () => text('pong')),
  ]);
}

runCli(buildConsole());
