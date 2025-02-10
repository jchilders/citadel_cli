import { describe, it, expect, beforeEach } from 'vitest';

import { CommandRegistry, NoopHandler, CommandHandler, ArgumentSegment } from '../command-registry';
import { TextCommandResult } from '../command-results';

describe('CommandRegistry', () => {
  let cmdRegistry: CommandRegistry;
  let successHandler: CommandHandler;

  beforeEach(() => {
    cmdRegistry = new CommandRegistry();
    successHandler = async (_args: string[]) => new TextCommandResult('success');
  });

  describe('addCommand', () => {
    it('should add leaf command successfully', () => {
      cmdRegistry.addCommand(
        [{ type: 'word', name: 'test' }],
        'Test command'
      );

      const node = cmdRegistry.getCommand(['test']);
      expect(node?.fullPath).toEqual(['test']);
      expect(node?.description).toBe('Test command');
      expect(node?.handler).toBe(NoopHandler);
    });

    it('should add nested commands successfully', () => {
      cmdRegistry.addCommand([
          { type: 'word', name: 'parent' },
          { type: 'word', name: 'child' }
        ],
        'Child command',
        successHandler
      );

      
      const childNode = cmdRegistry.getCommand(['parent', 'child']);
      expect(childNode?.description).toBe('Child command');
      expect(childNode?.handler).toBe(successHandler);
      expect(childNode?.fullPath).toEqual(['parent', 'child']);
    });

    it('should throw on empty path', () => {
      expect(() => cmdRegistry.addCommand(
        [],
        'Empty command'
      )).toThrow('Command path cannot be empty');
    });

    it('should throw on duplicate commands', () => {
      cmdRegistry.addCommand(
         [{ type: 'word', name: 'test' }],
        'Test command'
      );
      expect(() => cmdRegistry.addCommand(
        [{ type: 'word', name: 'test' }],
        'Duplicate test'
      )).toThrow("Duplicate commands: 'test' and 'test'");
    });

    it('should throw on duplicate commands with an argument', () => {
      cmdRegistry.addCommand(
        [
          { type: 'word', name: 'test' },
          { type: 'argument', name: 'arg1' }
        ],
        'word arg1'
      );
      expect(() => cmdRegistry.addCommand(
        [
          { type: 'word', name: 'test' },
          { type: 'argument', name: 'arg2' }
        ],
        'word arg2'
      )).toThrow("Duplicate commands: 'test arg1' and 'test arg2'");
    });
  });

  describe('getCompletions', () => {
    describe('no arguments', () => {
      beforeEach(() => {
        cmdRegistry.addCommand(
          [{ type: 'word', name: 'help' }],
          'Help command',
          successHandler
        );
        cmdRegistry.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'word', name: 'create' }
          ],
          'Create user',
          successHandler
        );
        cmdRegistry.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'word', name: 'delete' }
          ],
          'Delete user',
          successHandler
        );
      });

      it('should return root level segment completions', () => {
        const completions = cmdRegistry.getCompletions([]);
        expect(completions.length).toEqual(2);
        expect(completions).toContainEqual({ type: 'word', name: 'user' });
        expect(completions).toContainEqual({ type: 'word', name: 'help' });
      });

      it('should return nested completions', () => {
        const completions = cmdRegistry.getCompletions(['user']);
        expect(completions.length).toEqual(2);
        expect(completions).toContainEqual({ type: 'word', name: 'create' });
        expect(completions).toContainEqual({ type: 'word', name: 'delete' });
      });

      it('should return empty array for invalid completions', () => {
        const completions = cmdRegistry.getCompletions(['fnord']);
        expect(completions.length).toEqual(0);
      });
    });

    describe('one argument', () => {
      beforeEach(() => {
        cmdRegistry.addCommand(
          [{ type: 'word', name: 'help' }],
          'Help command',
          successHandler
        );
        cmdRegistry.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'argument', name: 'userId' },
            { type: 'word', name: 'create' }
          ],
          'Create user',
          successHandler
        );
        cmdRegistry.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'argument', name: 'userId' },
            { type: 'word', name: 'delete' }
          ],
          'Delete user',
          successHandler
        );
      });

      it('should return root level segment completions', () => {
        const completions = cmdRegistry.getCompletions([]);
        expect(completions.length).toEqual(2);
        expect(completions).toContainEqual({ type: 'word', name: 'user' });
        expect(completions).toContainEqual({ type: 'word', name: 'help' });
      });

      it('should return nested completions for parent word', () => {
        const completions = cmdRegistry.getCompletions(['user']);
        expect(completions.length).toEqual(1);
        expect(completions).toContainEqual({ type: 'argument', name: 'userId' });
      });

      it('should return nested completions for parent word child argument', () => {
        const completions = cmdRegistry.getCompletions(['user', 'userId']);
        expect(completions.length).toEqual(2);
        expect(completions).toContainEqual({ type: 'word', name: 'create' });
        expect(completions).toContainEqual({ type: 'word', name: 'delete' });
      });

      it('should return empty array for invalid completions', () => {
        const completions = cmdRegistry.getCompletions(['user', 'fnord']);
        expect(completions.length).toEqual(0);
      });
    });
  });

  describe('getCompletions_s', () => {
    describe('no arguments', () => {
      beforeEach(() => {
        cmdRegistry.addCommand(
          [{ type: 'word', name: 'help' }],
          'Help command',
          successHandler
        );
        cmdRegistry.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'word', name: 'create' }
          ],
          'Create user',
          successHandler
        );
        cmdRegistry.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'word', name: 'delete' }
          ],
          'Delete user',
          successHandler
        );
      });

      it('should return root level string completions', () => {
        const completions = cmdRegistry.getCompletions_s([]);
        expect(completions).toEqual(['help', 'user']);
      });

      it('should return nested completions', () => {
        const completions = cmdRegistry.getCompletions_s(['user']);
        expect(completions).toEqual(['create', 'delete']);
      });

      it('should return empty array for invalid path', () => {
        const completions = cmdRegistry.getCompletions_s(['invalid', 'path']);
        expect(completions).toEqual([]);
      });

      it('should return empty array for leaf command', () => {
        const completions = cmdRegistry.getCompletions_s(['help']);
        expect(completions).toEqual([]);
      });
    });

    describe('for commands with arguments', () => {
      beforeEach(() => {
        cmdRegistry.addCommand(
          [{ type: 'word', name: 'help' }],
          'Help command',
          successHandler
        );
        cmdRegistry.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'argument', name: 'userId' },
            { type: 'word', name: 'deactivate' }
          ],
          'Deactivate user',
          successHandler
        );
        cmdRegistry.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'argument', name: 'userId' },
            { type: 'word', name: 'delete' }
          ],
          'Delete user',
          successHandler
        );
      });

      it('should return argument name for word segment', () => {
        const completions = cmdRegistry.getCompletions_s(['user'])
        expect(completions).toEqual(['userId']);
      });

      it('should return children node names for word and argument segments', () => {
        const completions = cmdRegistry.getCompletions_s(['user', 'userId'])
        expect(completions).toEqual(['deactivate', 'delete']);
      });

    });
  });

  describe('CommandNode', () => {
    describe('fullPath', () => {
      it('should return correct path for single-level command', () => {
        cmdRegistry.addCommand(
          [{ type: 'word', name: 'test' }],
          'word test'
        );
        const node = cmdRegistry.getCommand(['test']);
        expect(node?.fullPath).toEqual(['test']);
      });

      it('should return correct path for nested command', () => {
        cmdRegistry.addCommand(
          [
            { type: 'word', name: 'parent' },
            { type: 'word', name: 'child' },
            { type: 'word', name: 'grandchild' }
          ],
          'description'
        );
        const node = cmdRegistry.getCommand(['parent', 'child', 'grandchild']);
        expect(node?.fullPath).toEqual(['parent', 'child', 'grandchild']);
      });

      it('should return correct path for command with arguments', () => {
        cmdRegistry.addCommand(
          [
            { type: 'word', name: 'command' },
            { type: 'argument', name: 'arg1' },
            { type: 'word', name: 'subcommand' }
          ],
          'description'
        );
        const node = cmdRegistry.getCommand(['command', 'arg1', 'subcommand']);
        expect(node?.fullPath).toEqual(['command', 'arg1', 'subcommand']);
      });
    });
  });

  describe('ArgumentSegment', () => {
    it('should store and retrieve value', () => {
      const arg = new ArgumentSegment('testArg', 'Test argument');
      arg.value = 'test value';
      expect(arg.value).toBe('test value');
    });

    it('should initialize with undefined value', () => {
      const arg = new ArgumentSegment('testArg', 'Test argument');
      expect(arg.value).toBeUndefined();
    });

    it('should initialize with optional value', () => {
      const arg = new ArgumentSegment('testArg', 'Test argument', 'initial value');
      expect(arg.value).toBe('initial value');
    });

    it('should have correct type', () => {
      const arg = new ArgumentSegment('testArg', 'Test argument');
      expect(arg.type).toBe('argument');
    });

    it('should have correct name', () => {
      const arg = new ArgumentSegment('testArg', 'Test argument');
      expect(arg.name).toBe('testArg');
    });

    it('should have correct description', () => {
      const arg = new ArgumentSegment('testArg', 'Test argument');
      expect(arg.description).toBe('Test argument');
    });

    it('should handle validation function', () => {
      const isValid = () => true;
      const arg = new ArgumentSegment('testArg', 'Test argument', undefined, isValid);
      expect(arg.valid).toBe(isValid);
    });

    it('should convert to string correctly', () => {
      const arg = new ArgumentSegment('testArg', 'Test argument');
      expect(arg.toString()).toBe('testArg');
    });
  });
});
