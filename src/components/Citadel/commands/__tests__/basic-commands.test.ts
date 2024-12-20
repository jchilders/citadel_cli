import { describe, it, expect, beforeEach } from 'vitest';
import { EchoCommand, HelpCommand, CalculatorCommand } from '../basic-commands';
import { TextCommandResult, JsonCommandResult } from '../../types/command-results';
import { CommandRegistry } from '../../registry/CommandRegistry';
import { ICommandRegistry } from '../../types/command-registry';

describe('Basic Commands', () => {
  let registry: ICommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  describe('EchoCommand', () => {
    it('should echo back input', async () => {
      const cmd = new EchoCommand();
      const result = await cmd.execute(['hello', 'world']);
      expect(result).toBeInstanceOf(TextCommandResult);
      expect(result.text).toBe('hello world');
    });

    it('should handle empty input', async () => {
      const cmd = new EchoCommand();
      const result = await cmd.execute([]);
      expect(result.text).toBe('');
    });

    it('should have correct metadata', () => {
      const cmd = new EchoCommand();
      expect(cmd.id).toBe('system.echo');
      expect(cmd.description).toBe('Echo back the input');
      expect(cmd.argument).toEqual({
        name: 'message',
        description: 'Message to echo back'
      });
    });
  });

  describe('HelpCommand', () => {
    let helpCommand: HelpCommand;

    beforeEach(() => {
      // Register some test commands
      registry.register(new EchoCommand());
      registry.register(new CalculatorCommand());
      registry.register(new HelpCommand(registry));
      helpCommand = new HelpCommand(registry);
    });

    it('should list all commands when no argument provided', async () => {
      const result = await helpCommand.execute([]);
      expect(result).toBeInstanceOf(TextCommandResult);
      expect(result.text).toContain('Available Commands:');
      expect(result.text).toContain('system.echo');
      expect(result.text).toContain('math.add');
      expect(result.text).toContain('system.help');
    });

    it('should show detailed help for a specific command', async () => {
      const result = await helpCommand.execute(['system.echo']);
      expect(result.text).toContain('Command: system.echo');
      expect(result.text).toContain('Description: Echo back the input');
      expect(result.text).toContain('message: Message to echo back');
    });

    it('should handle unknown commands', async () => {
      const result = await helpCommand.execute(['unknown.command']);
      expect(result.text).toBe('Command not found: unknown.command');
    });

    it('should show command metadata when available', async () => {
      // Create a new registry to avoid duplicate registration
      const testRegistry = new CommandRegistry();
      const helpCommand = new HelpCommand(testRegistry);
      testRegistry.register(new EchoCommand(), {
        permissions: ['user.basic'],
        timeout: 1000,
        rateLimits: { maxRequests: 10, timeWindow: 1000 }
      });

      const result = await helpCommand.execute(['system.echo']);
      expect(result.text).toContain('Required Permissions: user.basic');
      expect(result.text).toContain('Timeout: 1000ms');
      expect(result.text).toContain('Rate Limits: 10 requests per 1000ms');
    });

    it('should have correct metadata', () => {
      expect(helpCommand.id).toBe('system.help');
      expect(helpCommand.description).toBe('Display help information');
      expect(helpCommand.argument).toEqual({
        name: 'command',
        description: 'Command to get help for (optional)'
      });
    });
  });

  describe('CalculatorCommand', () => {
    it('should add numbers', async () => {
      const cmd = new CalculatorCommand();
      const result = await cmd.execute(['1', '2', '3']);
      expect(result).toBeInstanceOf(JsonCommandResult);
      expect(result.json).toEqual({ result: 6 });
    });

    it('should handle empty input', async () => {
      const cmd = new CalculatorCommand();
      const result = await cmd.execute([]);
      expect(result.json).toEqual({ result: 0 });
    });

    it('should handle invalid numbers', async () => {
      const cmd = new CalculatorCommand();
      await expect(cmd.execute(['1', 'abc', '3'])).rejects.toThrow();
    });

    it('should have correct metadata', () => {
      const cmd = new CalculatorCommand();
      expect(cmd.id).toBe('math.add');
      expect(cmd.description).toBe('Add a list of numbers');
      expect(cmd.argument).toEqual({
        name: 'numbers',
        description: 'Space-separated numbers to add'
      });
    });
  });
});
