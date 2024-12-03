import { describe, it, expect, beforeEach } from 'vitest';
import { CommandRegistry } from '../CommandRegistry';
import { DuplicateCommandError } from '../types/duplicate_command_error';
import { CommandExecutionError } from '../types/command_execution_error';
import { Command } from '../types/command';

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  describe('registerCommand', () => {
    it('should register a command successfully', () => {
      const command: Command = {
        name: 'test',
        description: 'Test command',
        handler: async () => ({ response: 'Test result'}),
      };
      registry.registerCommand(command);
      expect(registry.getCommandByPath(['test'])).toBe(command);
    });

    it('should throw DuplicateCommandError when registering a duplicate command', () => {
      const command: Command = {
        name: 'test',
        description: 'Test command',
        handler: async () => ({ response: 'Test result'}),
      };
      registry.registerCommand(command);
      expect(() => registry.registerCommand(command)).toThrowError(DuplicateCommandError);
    });

    it('should register subcommands successfully', () => {
      const subcommand: Command = {
        name: 'sub',
        description: 'Subcommand',
        handler: async () => ({ response: 'Test result'}),
      };
      const command: Command = {
        name: 'test',
        description: 'Test command',
        subcommands: [subcommand],
      };
      registry.registerCommand(command);
      expect(registry.getCommandByPath(['test', 'sub'])).toBe(subcommand);
    });

    it('should clean up parent command when subcommand registration fails', () => {
      const subcommand: Command = {
        name: 'sub',
        description: 'Subcommand',
        handler: async () => ({ response: 'Subcommand result'}),
      };
      const command: Command = {
        name: 'test',
        description: 'Test command',
        subcommands: [subcommand, subcommand], // Duplicate subcommand
      };
      expect(() => registry.registerCommand(command)).toThrowError(DuplicateCommandError);
      expect(registry.getCommandByPath(['test'])).toBeUndefined();
    });
  });

  describe('registerCommands', () => {
    it('should register multiple commands successfully', () => {
      const commands: Command[] = [
        { name: 'cmd1', description: 'Command 1', handler: async () => ({ response: 'Result 1' })},
        { name: 'cmd2', description: 'Command 2', handler: async () => ({ response: 'Result 2' })},
      ];
      registry.registerCommands(commands);
      expect(registry.getCommandByPath(['cmd1'])).toBe(commands[0]);
      expect(registry.getCommandByPath(['cmd2'])).toBe(commands[1]);
    });

    it('should rollback registration when an error occurs', () => {
      const commands: Command[] = [
        { name: 'cmd1', description: 'Command 1', handler: async () => ({ response: 'Result 1'} )},
        { name: 'cmd1', description: 'Duplicate command', handler: async () => ({ response: 'Result 2'}) },
      ];
      expect(() => registry.registerCommands(commands)).toThrowError(DuplicateCommandError);
      expect(registry.getCommandByPath(['cmd1'])).toBeUndefined();
    });
  });

  describe('executeCommand', () => {
    it('should execute a command successfully', async () => {
      const command: Command = {
        name: 'test',
        description: 'Test command',
        handler: async () => ({ response: 'Test result'} ),
      };
      registry.registerCommand(command);
      const result = await registry.executeCommand(['test'], []);
      expect(result).toStrictEqual({'response': 'Test result'});
    });

    it('should pass arguments to the command handler', async () => {
      const command: Command = {
        name: 'greet',
        description: 'Greeting command',
        handler: async (args) => ({ response: `Hello, ${args[0]}!` }),
      };
      registry.registerCommand(command);
      const result = await registry.executeCommand(['greet'], ['James']);
      expect(result).toStrictEqual({ response: 'Hello, James!' });
    });

    it('should return undefined when command is not found', async () => {
      const result = await registry.executeCommand(['nonexistent'], []);
      expect(result).toBeUndefined();
    });

    it('should return undefined when command has no handler', async () => {
      const command: Command = {
        name: 'test',
        description: 'Test command',
      };
      registry.registerCommand(command);
      const result = await registry.executeCommand(['test'], []);
      expect(result).toBeUndefined();
    });

    it('should throw CommandExecutionError when command execution fails', async () => {
      const command: Command = {
        name: 'test',
        description: 'Test command',
        handler: () => {
          throw new Error('Execution error');
        },
      };
      registry.registerCommand(command);
      await expect(registry.executeCommand(['test'], [])).rejects.toThrowError(CommandExecutionError);
    });
  });

  describe('getSubcommands', () => {
    it('should return subcommands of a command', () => {
      const subcommand1: Command = {
        name: 'sub1',
        description: 'Subcommand 1',
        handler: async () => ({ response: 'Subcommand 1 result'} ),
      };
      const subcommand2: Command = {
        name: 'sub2',
        description: 'Subcommand 2',
        handler: async () => ({ response: 'Subcommand 2 result'} ),
      };
      const command: Command = {
        name: 'test',
        description: 'Test command',
        subcommands: [subcommand1, subcommand2],
      };
      registry.registerCommand(command);
      expect(registry.getSubcommands(['test'])).toEqual([subcommand1, subcommand2]);
    });

    it('should return an empty array when command has no subcommands', () => {
      const command: Command = {
        name: 'test',
        description: 'Test command',
        handler: async () => ({ response: 'Test result'} ),
      };
      registry.registerCommand(command);
      expect(registry.getSubcommands(['test'])).toEqual([]);
    });

    it('should return an empty array when command is not found', () => {
      expect(registry.getSubcommands(['nonexistent'])).toEqual([]);
    });
  });

  describe('getCommandByPath', () => {
    it('should return the command by path', () => {
      const command: Command = {
        name: 'test',
        description: 'Test command',
        handler: async () => ({ response: 'Test result'} ),
      };
      registry.registerCommand(command);
      expect(registry.getCommandByPath(['test'])).toBe(command);
    });

    it('should return undefined when command is not found', () => {
      expect(registry.getCommandByPath(['nonexistent'])).toBeUndefined();
    });
  });

  describe('getRootCommands', () => {
    it('should return root commands', () => {
      const command1: Command = {
        name: 'cmd1',
        description: 'Command 1',
        handler: async () => ({ response: 'Result 1'} ),
      };
      const command2: Command = {
        name: 'cmd2',
        description: 'Command 2',
        handler: async () => ({ response: 'Result 2'} ),
      };
      registry.registerCommand(command1);
      registry.registerCommand(command2);
      expect(registry.getRootCommands()).toEqual([command1, command2]);
    });

    it('should not return subcommands as root commands', () => {
      const subcommand: Command = {
        name: 'sub',
        description: 'Subcommand',
        handler: async () => ({ response: 'Subcommand result'} ),
      };
      const command: Command = {
        name: 'test',
        description: 'Test command',
        subcommands: [subcommand],
      };
      registry.registerCommand(command);
      expect(registry.getRootCommands()).toEqual([command]);
    });
  });
});