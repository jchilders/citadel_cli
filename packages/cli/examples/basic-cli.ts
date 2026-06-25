/**
 * Example CLI: the web demo's **Basic** example, in your terminal.
 *
 * The command registry is *not* duplicated — `createBasicCommandRegistry` is the
 * exact same file the web demo uses (@citadel/sample-commands), proving the same
 * definitions drive both the web `<Citadel>` overlay and this terminal UI. Only
 * presentation differs (the adapter's renderResult): images show as
 * `[image: <url>]` and `cowsay`'s multi-line ASCII prints to stdout.
 *
 * Run it:
 *   npm run cli:basic                                   # interactive TUI
 *   npx tsx examples/basic-cli.ts --script=$'bt\nbf\n'  # scripted
 */
import { createBasicCommandRegistry } from '@citadel/sample-commands';
import { runCli } from '../src/run';

runCli(createBasicCommandRegistry(), {
  welcome: 'Citadel basic-cli — the web "Basic" example, in your terminal.',
});
