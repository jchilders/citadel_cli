import { CommandRegistry, WordSegment, createHelpHandler } from '@citadel_cli/core';
import { CliSession } from './session';
import { renderResult } from './render-result';
import { runTui, type CliOptions } from './tui';

/**
 * Auto-register a `help` command that lists every command (web parity with
 * `includeHelpCommand`), unless disabled or one already exists.
 */
export function ensureHelpCommand(registry: CommandRegistry, options: CliOptions): void {
  if (options.includeHelpCommand === false) return;
  if (registry.commandExistsForPath(['help'])) return;
  registry.addCommand([new WordSegment('help')], 'Show available commands', createHelpHandler(registry));
}

/**
 * Entry helper for CLIs built on @citadel_cli/core. With `--script=<keys>` it runs
 * non-interactively (characters are typed; '\n' presses Enter) and prints each
 * executed command's result — handy for demos, docs, and CI. Otherwise it
 * launches the interactive Ink TUI (output pane + command line + suggestions).
 * Build a registry with the command DSL and hand it here; see
 * examples/dungeon-console.ts. Pass `{ welcome }` to set the app's banner.
 */
export async function runCli(registry: CommandRegistry, options: CliOptions = {}): Promise<void> {
  ensureHelpCommand(registry, options);

  const scriptFlag = process.argv.find((arg) => arg.startsWith('--script='));

  if (!scriptFlag) {
    runTui(registry, options);
    return;
  }

  const keys = scriptFlag.slice('--script='.length);
  const session = new CliSession(registry, {
    onExecute: (item) => {
      const out = renderResult(item.result).replace(/\n/g, ' ');
      console.log(`${item.commandLine} → ${out}`);
    },
    commandTimeoutMs: options.commandTimeoutMs,
  });

  for (const ch of keys) {
    if (ch === '\n') {
      await session.press({ name: 'Enter' });
    } else {
      await session.typeChar(ch);
    }
  }
}
