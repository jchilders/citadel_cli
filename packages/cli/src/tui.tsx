// Default-import React (and use hooks via React.*) so this compiles under both
// the automatic JSX runtime (tsc) and the classic runtime that tsx uses at
// runtime — tsx ignores the tsconfig `jsx` setting and always emits
// React.createElement, so React must be in scope.
import React from 'react';
import { Box, Text, render, useApp, useInput, useStdout, type Key } from 'ink';
import Spinner from 'ink-spinner';
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

/** One output entry: "> command · time ●" then the result, mirroring the web. */
function OutputLine({ item }: { item: CliOutputItem }) {
  const time = new Date(item.timestamp).toLocaleTimeString();
  return (
    <Box flexDirection="column" marginBottom={1} flexShrink={0}>
      <Box>
        <Text dimColor>&gt; </Text>
        <Text>{item.commandLine}</Text>
        <Text dimColor> · {time} </Text>
        {item.status === CommandStatus.Pending ? (
          <Text color="yellow">
            <Spinner type="dots" />
          </Text>
        ) : item.status === CommandStatus.Success ? (
          <Text color="green">●</Text>
        ) : (
          <Text color="red">●</Text>
        )}
      </Box>
      {item.status !== CommandStatus.Pending && <Text>{renderResult(item.result)}</Text>}
    </Box>
  );
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

  const session = React.useMemo(
    () => new CliSession(registry, { onChange: forceRender, commandTimeoutMs }),
    [registry, commandTimeoutMs],
  );

  useInput((input, key) => {
    if (key.ctrl && (input === 'c' || input === 'd')) {
      exit();
      return;
    }
    const abstractKey = toAbstractKey(input, key);
    if (!abstractKey) return;
    if (abstractKey.name === 'char') {
      void session.typeChar(abstractKey.char);
    } else {
      void session.press(abstractKey);
    }
  });

  return (
    <Box flexDirection="column" height={rows} width={columns}>
      <Box paddingX={1} justifyContent="space-between">
        <Text color="cyan" bold>
          › CITADEL
        </Text>
        <Text dimColor>{welcome ?? ''}</Text>
      </Box>

      {/* Output pane: its own bordered box. Newest output sits at the bottom;
          older output scrolls off the top (overflow hidden + justify flex-end). */}
      <Box
        flexGrow={1}
        flexDirection="column"
        borderStyle="round"
        borderColor="gray"
        overflow="hidden"
        justifyContent="flex-end"
        paddingX={1}
      >
        {session.outputs.map((item) => (
          <OutputLine key={item.id} item={item} />
        ))}
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
