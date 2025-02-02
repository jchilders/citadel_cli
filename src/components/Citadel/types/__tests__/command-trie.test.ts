import { describe, it, expect, beforeEach } from 'vitest';

import { CommandTrie, NoopHandler, CommandHandler } from '../command-trie';
import { TextCommandResult } from '../command-results';

describe('CommandTrie', () => {
  let trie: CommandTrie;
  let successHandler: CommandHandler;

  beforeEach(() => {
    trie = new CommandTrie();
    successHandler = async (_args: string[]) => new TextCommandResult('success');
  });

  describe('addCommand', () => {
    it('should add leaf command successfully', () => {
      trie.addCommand(
        [{ type: 'word', name: 'test' }],
        'Test command'
      );

      const node = trie.getCommand(['test']);
      expect(node?.fullPath).toEqual(['test']);
      expect(node?.description).toBe('Test command');
      expect(node?.handler).toBe(NoopHandler);
    });

    it('should add nested commands successfully', () => {
      trie.addCommand([
          { type: 'word', name: 'parent' },
          { type: 'word', name: 'child' }
        ],
        'Child command',
        successHandler
      );

      
      const childNode = trie.getCommand(['parent', 'child']);
      expect(childNode?.description).toBe('Child command');
      expect(childNode?.handler).toBe(successHandler);
      expect(childNode?.fullPath).toEqual(['parent', 'child']);
    });

    it('should throw on empty path', () => {
      expect(() => trie.addCommand(
        [],
        'Empty command'
      )).toThrow('Command path cannot be empty');
    });

    it('should throw on duplicate commands', () => {
      trie.addCommand(
         [{ type: 'word', name: 'test' }],
        'Test command'
      );
      expect(() => trie.addCommand(
        [{ type: 'word', name: 'test' }],
        'Duplicate test'
      )).toThrow("Duplicate commands: 'test' and 'test'");
    });

    it('should throw on duplicate commands with an argument', () => {
      trie.addCommand(
        [
          { type: 'word', name: 'test' },
          { type: 'argument', name: 'arg1' }
        ],
        'word arg1'
      );
      expect(() => trie.addCommand(
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
        trie.addCommand(
          [{ type: 'word', name: 'help' }],
          'Help command',
          successHandler
        );
        trie.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'word', name: 'create' }
          ],
          'Create user',
          successHandler
        );
        trie.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'word', name: 'delete' }
          ],
          'Delete user',
          successHandler
        );
      });

      it('should return root level segment completions', () => {
        const completions = trie.getCompletions([]);
        expect(completions).toEqual([
          { type: 'word', name: 'help' },
          { type: 'word', name: 'user' }]);
      });

      it('should deduplicate first-level segments', () => {
        // Add more commands that start with 'user' to test deduplication
        trie.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'word', name: 'list' }
          ],
          'List users',
          successHandler
        );
        trie.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'word', name: 'search' }
          ],
          'Search users',
          successHandler
        );

        const completions = trie.getCompletions([]);
        expect(completions).toEqual([
          { type: 'word', name: 'help' },
          { type: 'word', name: 'user' }
        ]);
      });
    });
  });

  describe('getCompletions_s', () => {
    describe('no arguments', () => {
      beforeEach(() => {
        trie.addCommand(
          [{ type: 'word', name: 'help' }],
          'Help command',
          successHandler
        );
        trie.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'word', name: 'create' }
          ],
          'Create user',
          successHandler
        );
        trie.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'word', name: 'delete' }
          ],
          'Delete user',
          successHandler
        );
      });

      it('should return root level string completions', () => {
        const completions = trie.getCompletions_s([]);
        expect(completions).toEqual(['help', 'user']);
      });

      it('should return nested completions', () => {
        const completions = trie.getCompletions_s(['user']);
        expect(completions).toEqual(['create', 'delete']);
      });

      it('should return empty array for invalid path', () => {
        const completions = trie.getCompletions_s(['invalid', 'path']);
        expect(completions).toEqual([]);
      });

      it('should return empty array for leaf command', () => {
        const completions = trie.getCompletions_s(['help']);
        expect(completions).toEqual([]);
      });
    });

    describe('for commands with arguments', () => {
      beforeEach(() => {
        trie.addCommand(
          [{ type: 'word', name: 'help' }],
          'Help command',
          successHandler
        );
        trie.addCommand(
          [
            { type: 'word', name: 'user' },
            { type: 'argument', name: 'userId' },
            { type: 'word', name: 'deactivate' }
          ],
          'Deactivate user',
          successHandler
        );
        trie.addCommand(
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
        const completions = trie.getCompletions_s(['user'])
        expect(completions).toEqual(['userId']);
      });

      it('should return children node names for word and argument segments', () => {
        const completions = trie.getCompletions_s(['user', 'userId'])
        expect(completions).toEqual(['deactivate', 'delete']);
      });

    });
  });

  describe('CommandNode', () => {
    describe('fullPath', () => {
      it('should return correct path for single-level command', () => {
        trie.addCommand(
          [{ type: 'word', name: 'test' }],
          'word test'
        );
        const node = trie.getCommand(['test']);
        expect(node?.fullPath).toEqual(['test']);
      });

      it('should return correct path for nested command', () => {
        trie.addCommand(
          [
            { type: 'word', name: 'parent' },
            { type: 'word', name: 'child' },
            { type: 'word', name: 'grandchild' }
          ],
          'description'
        );
        const node = trie.getCommand(['parent', 'child', 'grandchild']);
        expect(node?.fullPath).toEqual(['parent', 'child', 'grandchild']);
      });

      it('should return correct path for command with arguments', () => {
        trie.addCommand(
          [
            { type: 'word', name: 'command' },
            { type: 'argument', name: 'arg1' },
            { type: 'word', name: 'subcommand' }
          ],
          'description'
        );
        const node = trie.getCommand(['command', 'arg1', 'subcommand']);
        expect(node?.fullPath).toEqual(['command', 'arg1', 'subcommand']);
      });
    });
  });
});
