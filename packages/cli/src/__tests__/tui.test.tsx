import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { App } from '../tui';
import { command, createCommandRegistry, text } from '@citadel_cli/core';

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

  it('scrolls the output history with PageUp / PageDown', async () => {
    let n = 0;
    const reg = createCommandRegistry([
      command('x').describe('row').handle(async () => text(`R${String(++n).padStart(2, '0')}`)),
    ]);
    const { lastFrame, stdin } = render(<App registry={reg} commandTimeoutMs={0} />);
    await delay(60);
    for (let i = 0; i < 12; i++) {
      stdin.write('x'); // → command x
      stdin.write('\r'); // execute → R01..R12
      await delay(12);
    }
    await delay(40);
    // Newest in view, oldest scrolled off the top.
    expect(lastFrame() ?? '').toContain('R12');
    expect(lastFrame() ?? '').not.toContain('R01');

    stdin.write('\x1b[5~'); // PageUp
    stdin.write('\x1b[5~');
    await delay(40);
    expect(lastFrame() ?? '').toContain('R01'); // scrolled to the top
    expect(lastFrame() ?? '').toContain('scrolled'); // scroll hint

    stdin.write('\x1b[6~'); // PageDown
    stdin.write('\x1b[6~');
    await delay(40);
    expect(lastFrame() ?? '').toContain('R12'); // back to the newest

    stdin.write('\x1b[1;2A'); // Shift+Up also scrolls back
    stdin.write('\x1b[1;2A');
    await delay(40);
    expect(lastFrame() ?? '').toContain('R01');
  });
});
