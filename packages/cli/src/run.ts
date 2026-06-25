import { CommandRegistry } from '@citadel/core';
import { CliSession } from './session';
import { renderResult } from './render-result';
import { runRepl, type ReplOptions } from './repl';

/**
 * Entry helper for CLIs built on @citadel/core. With `--script=<keys>` it runs
 * non-interactively (characters are typed; '\n' presses Enter) and prints each
 * executed command's result — handy for demos, docs, and CI. Otherwise it
 * launches the interactive readline REPL. Build a registry with the command DSL
 * and hand it here; see examples/dungeon-console.ts. Pass `{ welcome }` to set
 * the app's startup banner.
 */
export async function runCli(registry: CommandRegistry, options: ReplOptions = {}): Promise<void> {
  const scriptFlag = process.argv.find((arg) => arg.startsWith('--script='));

  if (!scriptFlag) {
    runRepl(registry, options);
    return;
  }

  const keys = scriptFlag.slice('--script='.length);
  const session = new CliSession(registry, (executed) => {
    const out = renderResult(executed.result).replace(/\n/g, ' ');
    console.log(`${executed.commandLine} → ${out}`);
  });

  for (const ch of keys) {
    if (ch === '\n') {
      await session.press({ name: 'Enter' });
    } else {
      await session.typeChar(ch);
    }
  }
}
