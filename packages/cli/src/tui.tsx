// Default-import React (and use hooks via React.*) so this compiles under both
// the automatic JSX runtime (tsc) and the classic runtime that tsx uses at
// runtime — tsx ignores the tsconfig `jsx` setting and always emits
// React.createElement, so React must be in scope.
import React from 'react';
import { Box, Static, Text, render, useApp, useInput, type Key } from 'ink';
import Spinner from 'ink-spinner';
import { CommandRegistry, CommandStatus, type AbstractKey } from '@citadel/core';
import { CliSession, type CliOutputItem, type CompletionView } from './session';
import { renderResult } from './render-result';

export interface CliOptions {
  /** Welcome line printed once above the app. */
  welcome?: string;
  /** Fail a command that runs longer than this many ms (web parity). 0 disables. */
  commandTimeoutMs?: number;
}

const PROMPT = 'citadel❯ ';

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

/** One row in the output pane: the command echo, a status mark, and the result. */
function OutputLine({ item }: { item: CliOutputItem }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text dimColor>❯ </Text>
        <Text>{item.commandLine}</Text>
        <Text> </Text>
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
      {item.status !== CommandStatus.Pending && (
        <Box marginLeft={2}>
          <Text>{renderResult(item.result)}</Text>
        </Box>
      )}
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
  return null;
}

export function App({ registry, commandTimeoutMs }: { registry: CommandRegistry; commandTimeoutMs?: number }) {
  const { exit } = useApp();
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

  // Resolved commands commit to <Static> (scrollback), in resolution order.
  // Ink's <Static> is memo'd, so pass a NEW array reference each render —
  // otherwise it never sees appended items. Pending commands stay in the live
  // region below with a spinner.
  const resolved = [...session.resolvedOutputs];
  const pending = session.outputs.filter((item) => item.status === CommandStatus.Pending);

  return (
    <Box flexDirection="column">
      <Static items={resolved}>{(item) => <OutputLine key={item.id} item={item} />}</Static>

      {pending.map((item) => (
        <OutputLine key={item.id} item={item} />
      ))}

      <Box>
        <Text color="cyan">{PROMPT}</Text>
        <Text>{session.renderPrompt()}</Text>
        <Text inverse> </Text>
      </Box>

      <Suggestions view={session.completionView()} />
    </Box>
  );
}

/** Run the interactive Ink TUI: an output pane (scrollback) + command line + suggestions. */
export function runTui(registry: CommandRegistry, options: CliOptions = {}): void {
  if (options.welcome) {
    process.stdout.write(`${options.welcome}  \x1b[2m(Ctrl+C or Ctrl+D to quit)\x1b[0m\n\n`);
  }
  const app = render(<App registry={registry} commandTimeoutMs={options.commandTimeoutMs} />);
  void app.waitUntilExit();
}
