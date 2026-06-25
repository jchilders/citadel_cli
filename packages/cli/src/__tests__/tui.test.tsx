import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { App } from '../tui';
import { command, createCommandRegistry, text } from '@citadel/core';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildRegistry() {
  return createCommandRegistry([
    command('ping').describe('Ping').handle(async () => text('pong')),
    command('brew.espresso').describe('Espresso').handle(async () => text('coffee')),
  ]);
}

describe('Ink TUI', () => {
  it('renders the title, output box, and the suggestion list', async () => {
    const { lastFrame } = render(<App registry={buildRegistry()} commandTimeoutMs={0} />);
    await delay(40);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('CITADEL'); // title bar
    expect(frame).toContain('╭'); // output pane border
    expect(frame).toContain('ping'); // suggestion
    expect(frame).toContain('brew'); // suggestion
  });

  it('auto-expands a typed prefix in the command line', async () => {
    const { lastFrame, stdin } = render(<App registry={buildRegistry()} commandTimeoutMs={0} />);
    await delay(60); // let Ink subscribe to stdin
    stdin.write('p'); // unique prefix → ping
    await delay(40);
    expect(lastFrame() ?? '').toContain('ping');
  });

  it('runs a command and commits its result to the output pane', async () => {
    const { lastFrame, stdin } = render(<App registry={buildRegistry()} commandTimeoutMs={0} />);
    await delay(60);
    stdin.write('p'); // → ping
    await delay(20);
    stdin.write('\r'); // Enter → execute
    await delay(60);
    expect(lastFrame() ?? '').toContain('pong');
  });
});
