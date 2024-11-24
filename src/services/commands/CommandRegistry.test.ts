// import { jest } from '@jest/globals';
import { CommandRegistry } from './CommandRegistry';
import { Command, CommandResponse } from './types/command';
import { DuplicateCommandError } from './types/duplicate_command_error';
import { CommandExecutionError } from './types/command_execution_error';

const mockHandlers = {
  basicHandler: async (args: string[]): Promise<CommandResponse> => ({
    success: true,
    args: args
  }),
  errorHandler: async (): Promise<CommandResponse> => {
    throw new Error("Mock error");
  }
};

describe('CommandRegistry', () => {
  let registry: CommandRegistry;
  
  // Common test commands
  const basicCommand: Command = {
    name: 'test',
    description: 'Basic test command',
    handler: mockHandlers.basicHandler
  };

  const nestedCommands: Command = {
    name: 'parent',
    description: 'Parent command',
    subcommands: [{
      name: 'child',
      description: 'Child command',
      handler: mockHandlers.basicHandler,
      subcommands: [{
        name: 'grandchild',
        description: 'Grandchild command',
        handler: mockHandlers.basicHandler
      }]
    }]
  };

  const errorCommand: Command = {
    name: 'error',
    description: 'Error command',
    handler: mockHandlers.errorHandler
  };

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  describe('registerCommand', () => {
    it('should register a basic command', () => {
      registry.registerCommand(basicCommand);
      expect(registry.getCommandByPath(['test'])).toBe(basicCommand);
    });

    it('should register nested commands', () => {
      registry.registerCommand(nestedCommands);
      expect(registry.getCommandByPath(['parent', 'child', 'grandchild'])).toBeDefined();
    });

    it('should throw DuplicateCommandError for duplicate commands', () => {
      registry.registerCommand(basicCommand);
      expect(() => registry.registerCommand(basicCommand)).toThrow(DuplicateCommandError);
    });

    it('should rollback parent registration if child registration fails', () => {
      const duplicateNestedCommand: Command = {
        name: 'parent2',
        description: 'Parent command',
        subcommands: [basicCommand, basicCommand] // Duplicate subcommands
      };

      expect(() => registry.registerCommand(duplicateNestedCommand)).toThrow(DuplicateCommandError);
      expect(registry.getCommandByPath(['parent2'])).toBeUndefined();
    });
  });

  describe('registerCommands', () => {
    it('should register multiple commands', () => {
      const commands = [basicCommand, nestedCommands];
      registry.registerCommands(commands);
      expect(registry.getRootCommands()).toHaveLength(2);
    });

    it('should rollback all registrations if any command fails', () => {
      const commands = [
        basicCommand,
        nestedCommands,
        basicCommand // Duplicate that should cause failure
      ];

      expect(() => registry.registerCommands(commands)).toThrow(DuplicateCommandError);
      expect(registry.getRootCommands()).toHaveLength(0);
    });
  });

  describe('executeCommand', () => {
    it('should execute a command with args', async () => {
      registry.registerCommand(basicCommand);
      const result = await registry.executeCommand(['test'], ['arg1']);
      expect(result).toEqual({ success: true, args: ['arg1'] });
    });

    it('should execute nested commands', async () => {
      registry.registerCommand(nestedCommands);
      const result = await registry.executeCommand(['parent', 'child'], ['arg1']);
      expect(result).toEqual({ success: true, args: ['arg1'] });
    });

    it('should return undefined for non-existent commands', async () => {
      const result = await registry.executeCommand(['nonexistent'], []);
      expect(result).toBeUndefined();
    });

    it('should return undefined for commands without handlers', async () => {
      const noHandlerCommand: Command = {
        name: 'nohandler',
        description: 'No handler command'
      };
      registry.registerCommand(noHandlerCommand);
      const result = await registry.executeCommand(['nohandler'], []);
      expect(result).toBeUndefined();
    });

    it('should throw CommandExecutionError when handler throws', async () => {
      registry.registerCommand(errorCommand);
      await expect(registry.executeCommand(['error'], []))
        .rejects
        .toThrow(CommandExecutionError);
    });
  });

  describe('getSubcommands', () => {
    it('should return subcommands for a command', () => {
      registry.registerCommand(nestedCommands);
      const subcommands = registry.getSubcommands(['parent']);
      expect(subcommands).toHaveLength(1);
      expect(subcommands[0].name).toBe('child');
    });

    it('should return empty array for commands without subcommands', () => {
      registry.registerCommand(basicCommand);
      expect(registry.getSubcommands(['test'])).toHaveLength(0);
    });

    it('should return empty array for non-existent commands', () => {
      expect(registry.getSubcommands(['nonexistent'])).toHaveLength(0);
    });
  });

  describe('getRootCommands', () => {
    it('should return all root-level commands', () => {
      const commands = [basicCommand, nestedCommands, errorCommand];
      registry.registerCommands(commands);
      expect(registry.getRootCommands()).toHaveLength(3);
    });

    it('should not return nested commands as root commands', () => {
      registry.registerCommand(nestedCommands);
      const rootCommands = registry.getRootCommands();
      expect(rootCommands).toHaveLength(1);
      expect(rootCommands[0].name).toBe('parent');
    });
  });
});