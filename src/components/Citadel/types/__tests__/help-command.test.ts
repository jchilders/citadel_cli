import { describe, it, expect } from 'vitest';
import { createHelpHandler } from '../help-command';
import { CommandRegistry, WordSegment, ArgumentSegment } from '../command-registry';
import { TextCommandResult } from '../command-results';

describe('createHelpHandler', () => {
  it('lists commands alphabetically, formats arguments, and appends help entry', async () => {
    const registry = new CommandRegistry();
    registry.addCommand(
      [new WordSegment('deploy'), new ArgumentSegment('environment')],
      'Deploy the current build'
    );
    registry.addCommand(
      [new WordSegment('status')],
      'Check current status'
    );
    registry.addCommand(
      [new WordSegment('help')],
      'Show available commands'
    );

    const handler = createHelpHandler(registry);
    const result = await handler();

    expect(result).toBeInstanceOf(TextCommandResult);
    const lines = result.text.split('\n');

    expect(lines[0]).toBe('Available Commands:');
    expect(lines.slice(1)).toEqual([
      'deploy <environment> - Deploy the current build',
      'status - Check current status',
      'help - Show available commands'
    ]);
  });

  it('returns fallback message when no commands exist', async () => {
    const registry = new CommandRegistry();
    const handler = createHelpHandler(registry);

    const result = await handler();

    expect(result).toBeInstanceOf(TextCommandResult);
    expect(result.text).toBe('No commands available yet. Add some commands to get started!');
  });
});
