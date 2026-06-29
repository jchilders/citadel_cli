import { describe, expect, it } from 'vitest';
import { command, createCommandRegistry, json, text } from '@citadel/core';
import { CliSession } from '../session';
import { renderResult } from '../render-result';

// Same engine the web uses, driven keystroke-by-keystroke through a terminal
// session: `ping`, `user show <id>`, `user list`.
function buildRegistry() {
  return createCommandRegistry([
    command('ping').describe('Ping').handle(async () => text('pong')),
    command('user.show')
      .describe('Show user')
      .arg('userId', (arg) => arg.describe('Enter user ID'))
      .handle(async ({ namedArgs }) => json({ id: namedArgs.userId })),
    command('user.list').describe('List users').handle(async () => text('alice, bob')),
  ]);
}

async function type(session: CliSession, text: string): Promise<void> {
  for (const ch of text) {
    await session.typeChar(ch);
  }
}

describe('CliSession (core reuse in the terminal)', () => {
  it('auto-expands a unique prefix and executes an arg-less command', async () => {
    const session = new CliSession(buildRegistry());
    await type(session, 'pi'); // 'p' already disambiguates to ping
    expect(session.path()).toEqual(['ping']);

    await session.press({ name: 'Enter' });
    expect(session.outputs).toHaveLength(1);
    expect(renderResult(session.outputs[0].result)).toBe('pong');
  });

  it('expands words then commits an argument value on Enter', async () => {
    const session = new CliSession(buildRegistry());
    await type(session, 'u'); // → user
    await type(session, 's'); // → show (vs list)
    expect(session.path()).toEqual(['user', 'show']);

    await type(session, '42');
    await session.press({ name: 'Enter' });

    expect(session.outputs).toHaveLength(1);
    expect(session.outputs[0].path).toEqual(['user', 'show', 'userId']);
    expect(renderResult(session.outputs[0].result)).toBe(JSON.stringify({ id: '42' }, null, 2));
  });

  it('commits a quoted argument without its quotes', async () => {
    const session = new CliSession(buildRegistry());
    await type(session, 'us');
    await type(session, '"the answer"');
    await session.press({ name: 'Enter' });
    expect(renderResult(session.outputs[0].result)).toBe(JSON.stringify({ id: 'the answer' }, null, 2));
  });

  it('rejects a character that cannot continue any command', async () => {
    const session = new CliSession(buildRegistry());
    expect(await session.typeChar('z')).toBe(false);
    expect(session.path()).toEqual([]);
    expect(session.input).toBe('');
  });

  it('pops the last segment on Backspace with an empty buffer', async () => {
    const session = new CliSession(buildRegistry());
    await type(session, 'u'); // → user
    expect(session.path()).toEqual(['user']);
    await session.press({ name: 'Backspace' });
    expect(session.path()).toEqual([]);
  });

  it('renders a handler error as an error result', async () => {
    const registry = createCommandRegistry([
      command('boom').describe('throws').handle(async () => {
        throw new Error('kaboom');
      }),
    ]);
    const session = new CliSession(registry);
    await type(session, 'boom');
    await session.press({ name: 'Enter' });
    expect(renderResult(session.outputs[0].result)).toBe('Error: kaboom');
  });

  it('recalls the previous command via ArrowUp', async () => {
    const session = new CliSession(buildRegistry());
    await type(session, 'pi');
    await session.press({ name: 'Enter' });
    expect(session.path()).toEqual([]); // reset after execute

    await session.press({ name: 'ArrowUp' });
    expect(session.path()).toEqual(['ping']);
  });
});
