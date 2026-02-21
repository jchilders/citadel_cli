import { describe, expect, it } from 'vitest';
import { CommandRegistry } from '../command-registry';
import { TextCommandResult } from '../command-results';
import {
  command,
  createCommandRegistry,
  error,
  image,
  json,
  registerCommand,
  registerCommands,
  text,
} from '../command-dsl';

describe('command DSL', () => {
  it('builds command metadata with command and argument descriptions', () => {
    const definition = command('user.show')
      .describe('Show user details')
      .details('Fetches user data by ID.')
      .arg('userId', (argument) => argument.describe('Enter user ID'))
      .handle(async ({ namedArgs }) => text(`User ${namedArgs.userId}`));

    expect(definition.path).toBe('user.show');
    expect(definition.description).toBe('Show user details');
    expect(definition.details).toBe('Fetches user data by ID.');
    expect(definition.segments).toEqual([
      { type: 'word', name: 'user' },
      { type: 'word', name: 'show' },
      { type: 'argument', name: 'userId', description: 'Enter user ID' },
    ]);
  });

  it('maps handler args to namedArgs deterministically', async () => {
    const registry = new CommandRegistry();
    const definition = command('user.show')
      .describe('Show user details')
      .arg('userId')
      .arg('region')
      .handle(async ({ rawArgs, namedArgs, commandPath }) => {
        expect(commandPath).toBe('user.show');
        expect(rawArgs).toEqual(['42', 'us-east-1']);
        expect(namedArgs).toEqual({
          userId: '42',
          region: 'us-east-1',
        });
        return text('ok');
      });

    registerCommand(registry, definition);
    const commandNode = registry.getCommand(['user', 'show']);
    expect(commandNode).toBeTruthy();

    const result = await commandNode!.handler(['42', 'us-east-1']);
    expect(result).toBeInstanceOf(TextCommandResult);
  });

  it('creates and registers multiple commands in one call', async () => {
    const registry = createCommandRegistry([
      command('user.show')
        .describe('Show user')
        .arg('userId')
        .handle(async () => text('show')),
      command('user.deactivate')
        .describe('Deactivate user')
        .arg('userId')
        .handle(async () => text('deactivate')),
    ]);

    expect(registry.getCommand(['user', 'show'])).toBeTruthy();
    expect(registry.getCommand(['user', 'deactivate'])).toBeTruthy();

    const result = await registry.getCommand(['user', 'deactivate'])!.handler(['9']);
    expect(result).toBeInstanceOf(TextCommandResult);
  });

  it('registers multiple commands onto an existing registry', () => {
    const registry = new CommandRegistry();
    registerCommands(registry, [
      command('help').describe('Show help').handle(async () => text('help')),
      command('status').describe('Show status').handle(async () => text('status')),
    ]);

    expect(registry.getCommand(['help'])).toBeTruthy();
    expect(registry.getCommand(['status'])).toBeTruthy();
  });

  it('rejects invalid command paths', () => {
    expect(() => command('').describe('Invalid').handle(async () => text('x'))).toThrow(
      'Command path cannot be empty'
    );

    expect(() =>
      command('user..show').describe('Invalid').handle(async () => text('x'))
    ).toThrow('Invalid command path "user..show". Empty segments are not allowed.');

    expect(() =>
      command('user show').describe('Invalid').handle(async () => text('x'))
    ).toThrow(
      'Invalid command path "user show". Use dot-delimited words (e.g. "user.show").'
    );
  });

  it('provides result helper constructors', () => {
    expect(text('hello').text).toBe('hello');
    expect(json({ ok: true }).data).toEqual({ ok: true });
    expect(image('https://example.com/a.png').imageUrl).toBe('https://example.com/a.png');
    expect(error('bad').error).toBe('bad');
  });
});
