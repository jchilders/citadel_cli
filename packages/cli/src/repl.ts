import * as readline from 'node:readline';
import { CommandRegistry, type AbstractKey } from '@citadel/core';
import { CliSession } from './session';
import { renderResult } from './render-result';

const PROMPT = 'citadel❯ ';

/** Map a Node readline keypress to the engine's framework-agnostic AbstractKey. */
function toAbstractKey(str: string | undefined, key: readline.Key): AbstractKey | null {
  if (key.name === 'return' || key.name === 'enter') return { name: 'Enter' };
  if (key.name === 'backspace') return { name: 'Backspace' };
  if (key.name === 'up') return { name: 'ArrowUp' };
  if (key.name === 'down') return { name: 'ArrowDown' };
  if (str && str.length === 1 && !key.ctrl && !key.meta) return { name: 'char', char: str };
  return null;
}

/** Run an interactive readline REPL backed by the @citadel/core engine. */
export function runRepl(registry: CommandRegistry): void {
  const out = process.stdout;

  const session = new CliSession(registry, (executed) => {
    out.write('\n' + renderResult(executed.result) + '\n');
  });

  const draw = () => {
    readline.cursorTo(out, 0);
    readline.clearLine(out, 0);
    const suggestions = session.suggestions();
    const hint = suggestions.length ? `   \x1b[2m(${suggestions.join('  ')})\x1b[0m` : '';
    out.write(`${PROMPT}${session.renderPrompt()}${hint}`);
    readline.cursorTo(out, PROMPT.length + session.renderPrompt().length);
  };

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  out.write('Citadel CLI — same engine as the web. Ctrl+C to quit.\n');
  draw();

  process.stdin.on('keypress', async (str: string | undefined, key: readline.Key) => {
    if (key.ctrl && key.name === 'c') {
      out.write('\n');
      process.exit(0);
    }
    const abstractKey = toAbstractKey(str, key);
    if (!abstractKey) return;

    if (abstractKey.name === 'char') {
      const accepted = await session.typeChar(abstractKey.char);
      if (!accepted) out.write('\x07'); // bell on invalid input
    } else {
      await session.press(abstractKey);
    }
    draw();
  });
}
