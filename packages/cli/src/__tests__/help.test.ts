import { describe, expect, it } from 'vitest';
import { command, createCommandRegistry, text } from '@citadel/core';
import { ensureHelpCommand } from '../run';
import { CliSession } from '../session';
import { renderResult } from '../render-result';

function buildRegistry() {
  return createCommandRegistry([
    command('ping').describe('Health check').handle(async () => text('pong')),
    command('user.show').describe('Show user').arg('id').handle(async () => text('ok')),
  ]);
}

async function type(session: CliSession, keys: string) {
  for (const ch of keys) {
    if (ch === '\n') await session.press({ name: 'Enter' });
    else await session.typeChar(ch);
  }
}

describe('auto help command', () => {
  it('registers a help command by default', () => {
    const registry = buildRegistry();
    ensureHelpCommand(registry, {});
    expect(registry.commandExistsForPath(['help'])).toBe(true);
  });

  it('is suppressed by includeHelpCommand: false', () => {
    const registry = buildRegistry();
    ensureHelpCommand(registry, { includeHelpCommand: false });
    expect(registry.commandExistsForPath(['help'])).toBe(false);
  });

  it('does not overwrite an existing help command', () => {
    const registry = createCommandRegistry([
      command('help').describe('custom').handle(async () => text('my help')),
    ]);
    ensureHelpCommand(registry, {});
    const session = new CliSession(registry);
    // typing the unique prefix executes the user-defined help, not the generated one.
    return type(session, 'h\n').then(() => {
      expect(renderResult(session.outputs[0].result)).toBe('my help');
    });
  });

  it('lists all commands when executed', async () => {
    const registry = buildRegistry();
    ensureHelpCommand(registry, {});
    const session = new CliSession(registry);
    await type(session, 'h\n'); // h → help (unique), Enter → execute
    const out = renderResult(session.outputs[0].result);
    expect(out).toContain('Available Commands');
    expect(out).toContain('[p]ing - Health check');
    expect(out).toContain('[u]ser [s]how');
  });
});
