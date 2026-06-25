import * as readline from 'node:readline';
import { CommandRegistry, type AbstractKey } from '@citadel/core';
import { CliSession, type CompletionView } from './session';
import { renderResult } from './render-result';

const PROMPT = 'citadel❯ ';

// ANSI helpers.
const BOLD_CYAN = '\x1b[1;36m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

/** Map a Node readline keypress to the engine's framework-agnostic AbstractKey. */
function toAbstractKey(str: string | undefined, key: readline.Key): AbstractKey | null {
  if (key.name === 'return' || key.name === 'enter') return { name: 'Enter' };
  if (key.name === 'backspace') return { name: 'Backspace' };
  if (key.name === 'up') return { name: 'ArrowUp' };
  if (key.name === 'down') return { name: 'ArrowDown' };
  if (str && str.length === 1 && !key.ctrl && !key.meta) return { name: 'char', char: str };
  return null;
}

/**
 * The suggestion line shown beneath the prompt (or '' for none). Command words
 * render with their shortest unambiguous prefix highlighted — the keys that
 * auto-expand them — mirroring the web's AvailableCommands.
 */
function renderSuggestions(view: CompletionView): string {
  if (view.kind === 'commands') {
    return view.items
      .map(({ name, prefixLength }) => {
        const head = name.slice(0, prefixLength);
        const tail = name.slice(prefixLength);
        return `${BOLD_CYAN}${head}${RESET}${DIM}${tail}${RESET}`;
      })
      .join('  ');
  }
  if (view.kind === 'argument') {
    const label = view.optional ? `[${view.name}]` : `<${view.name}>`;
    const desc = view.description ? `  ${view.description}` : '';
    return `${DIM}${label}${desc}${RESET}`;
  }
  return '';
}

/** Run an interactive readline REPL backed by the @citadel/core engine. */
export function runRepl(registry: CommandRegistry): void {
  const out = process.stdout;

  const session = new CliSession(registry, (executed) => {
    // Wipe the live prompt block, commit the typed command + its result to
    // scrollback, then let draw() render a fresh prompt below.
    readline.cursorTo(out, 0);
    readline.clearScreenDown(out);
    out.write(`${DIM}${PROMPT}${RESET}${executed.commandLine}\n`);
    out.write(renderResult(executed.result) + '\n');
  });

  // Render the prompt line, with the suggestion line on the row below, and park
  // the cursor back at the end of the prompt.
  const draw = () => {
    readline.cursorTo(out, 0);
    readline.clearScreenDown(out);

    const promptText = `${PROMPT}${session.renderPrompt()}`;
    out.write(promptText);

    const suggestions = renderSuggestions(session.completionView());
    if (suggestions) {
      out.write('\n' + suggestions);
      readline.moveCursor(out, 0, -1); // back up to the prompt row
    }
    readline.cursorTo(out, promptText.length);
  };

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  out.write(`${DIM}Citadel CLI — same engine as the web. Ctrl+C to quit.${RESET}\n`);
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
