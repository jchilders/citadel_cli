// Default-import React (and use hooks via React.*) so this compiles under both
// the automatic JSX runtime (tsc) and the classic runtime that tsx uses at
// runtime — tsx ignores the tsconfig `jsx` setting and always emits
// React.createElement, so React must be in scope.
import React from 'react';
import { Box, Text, render, useApp, useInput, useStdout, type Key } from 'ink';
import { CommandRegistry, CommandStatus, type AbstractKey } from '@citadel/core';
import { CliSession, type CliOutputItem, type CompletionView } from './session';
import { renderResult } from './render-result';

export interface CliOptions {
  /** Title line shown at the top of the full-screen UI. */
  welcome?: string;
  /** Fail a command that runs longer than this many ms (web parity). 0 disables. */
  commandTimeoutMs?: number;
}

const PROMPT = '> ';
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Tiny ANSI helpers — the output pane is rendered as a windowed string (so it
// can scroll), not Ink components, so styling is inlined here.
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

/** Map an Ink keypress to the engine's framework-agnostic AbstractKey. */
function toAbstractKey(input: string, key: Key): AbstractKey | null {
  if (key.return) return { name: 'Enter' };
  if (key.backspace || key.delete) return { name: 'Backspace' };
  if (key.upArrow) return { name: 'ArrowUp' };
  if (key.downArrow) return { name: 'ArrowDown' };
  if (input.length === 1 && !key.ctrl && !key.meta && !key.escape && !key.tab) {
    return { name: 'char', char: input };
  }
  return null;
}

/** Track the terminal size, re-rendering on resize so the UI stays full-screen. */
function useTerminalSize() {
  const { stdout } = useStdout();
  const [size, setSize] = React.useState({
    rows: stdout.rows || 24,
    columns: stdout.columns || 80,
  });
  React.useEffect(() => {
    const onResize = () => setSize({ rows: stdout.rows || 24, columns: stdout.columns || 80 });
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);
  return size;
}

/** Flatten the output history into styled lines: "> cmd · time ●" then the result. */
function outputToLines(outputs: readonly CliOutputItem[], spinner: string): string[] {
  const lines: string[] = [];
  for (const item of outputs) {
    const time = new Date(item.timestamp).toLocaleTimeString();
    const mark =
      item.status === CommandStatus.Pending
        ? yellow(spinner)
        : item.status === CommandStatus.Success
          ? green('●')
          : red('●');
    lines.push(`${dim('>')} ${item.commandLine} ${dim(`· ${time}`)} ${mark}`);
    if (item.status !== CommandStatus.Pending) {
      for (const line of renderResult(item.result).split('\n')) lines.push(line);
    }
    lines.push(''); // blank line between entries
  }
  return lines;
}

/** The suggestion line: command words with bold auto-expand prefixes, or the arg. */
function Suggestions({ view }: { view: CompletionView }) {
  if (view.kind === 'commands') {
    return (
      <Box>
        {view.items.map((item, i) => (
          <Text key={item.name}>
            {i > 0 ? '  ' : ''}
            <Text color="cyan" bold>
              {item.name.slice(0, item.prefixLength)}
            </Text>
            <Text dimColor>{item.name.slice(item.prefixLength)}</Text>
          </Text>
        ))}
      </Box>
    );
  }
  if (view.kind === 'argument') {
    const label = view.optional ? `[${view.name}]` : `<${view.name}>`;
    return (
      <Text dimColor>
        {label}
        {view.description ? `  ${view.description}` : ''}
      </Text>
    );
  }
  return <Text> </Text>;
}

export function App({
  registry,
  commandTimeoutMs,
  welcome,
}: {
  registry: CommandRegistry;
  commandTimeoutMs?: number;
  welcome?: string;
}) {
  const { exit } = useApp();
  const { rows, columns } = useTerminalSize();
  const [, forceRender] = React.useReducer((n: number) => n + 1, 0);
  const [scrollOffset, setScrollOffset] = React.useState(0); // lines scrolled up from the bottom
  const [spinnerFrame, setSpinnerFrame] = React.useState(0);
  const maxOffset = React.useRef(0);

  const session = React.useMemo(
    () => new CliSession(registry, { onChange: forceRender, commandTimeoutMs }),
    [registry, commandTimeoutMs],
  );

  // Animate the pending spinner only while something is in flight.
  const hasPending = session.outputs.some((item) => item.status === CommandStatus.Pending);
  React.useEffect(() => {
    if (!hasPending) return;
    const id = setInterval(() => setSpinnerFrame((f) => (f + 1) % SPINNER.length), 80);
    return () => clearInterval(id);
  }, [hasPending]);

  // Inner height of the output box: rows minus title, prompt, suggestions, borders.
  const viewport = Math.max(1, rows - 5);
  const page = Math.max(1, viewport - 1);

  useInput((input, key) => {
    if (key.ctrl && (input === 'c' || input === 'd')) {
      exit();
      return;
    }
    if (key.pageUp) {
      setScrollOffset((o) => Math.min(maxOffset.current, o + page));
      return;
    }
    if (key.pageDown) {
      setScrollOffset((o) => Math.max(0, o - page));
      return;
    }
    const abstractKey = toAbstractKey(input, key);
    if (!abstractKey) return;
    setScrollOffset(0); // any command input snaps back to the newest output
    if (abstractKey.name === 'char') {
      void session.typeChar(abstractKey.char);
    } else {
      void session.press(abstractKey);
    }
  });

  // Window the output to the viewport, honoring the scroll offset (0 = newest).
  const lines = outputToLines(session.outputs, SPINNER[spinnerFrame]);
  maxOffset.current = Math.max(0, lines.length - viewport);
  const offset = Math.min(scrollOffset, maxOffset.current);
  const end = lines.length - offset;
  const start = Math.max(0, end - viewport);
  const visible = lines.slice(start, end);

  const scrollHint =
    offset > 0
      ? `↑ scrolled · PgDn → newest`
      : maxOffset.current > 0
        ? `PgUp/PgDn to scroll`
        : (welcome ?? '');

  return (
    <Box flexDirection="column" height={rows} width={columns}>
      <Box paddingX={1} justifyContent="space-between">
        <Text color="cyan" bold>
          › CITADEL
        </Text>
        <Text dimColor>{scrollHint}</Text>
      </Box>

      {/* Output pane: its own bordered box, line-windowed so it can scroll. */}
      <Box flexGrow={1} borderStyle="round" borderColor="gray" overflow="hidden" paddingX={1}>
        <Text>{visible.join('\n')}</Text>
      </Box>

      {/* Command line, pinned. */}
      <Box paddingX={1}>
        <Text color="cyan">{PROMPT}</Text>
        <Text>{session.renderPrompt()}</Text>
        <Text inverse> </Text>
      </Box>

      {/* Available commands, pinned. */}
      <Box paddingX={1}>
        <Suggestions view={session.completionView()} />
      </Box>
    </Box>
  );
}

/** Run the interactive full-screen Ink TUI (output pane + command line + suggestions). */
export function runTui(registry: CommandRegistry, options: CliOptions = {}): void {
  const stdout = process.stdout;
  stdout.write('\x1b[?1049h'); // enter the alternate screen buffer (full screen)
  const restore = () => stdout.write('\x1b[?1049l'); // restore the main screen

  const app = render(
    <App registry={registry} commandTimeoutMs={options.commandTimeoutMs} welcome={options.welcome} />,
  );
  app.waitUntilExit().then(restore, restore);
  process.on('exit', restore);
}
