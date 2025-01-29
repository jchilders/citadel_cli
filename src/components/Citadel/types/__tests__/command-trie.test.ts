import { describe, it, expect, beforeEach } from 'vitest';

import { CommandTrie, NoopHandler, CommandHandler } from '../command-trie';
import { TextCommandResult } from '../command-results';

describe('CommandTrie', () => {
  let trie: CommandTrie;

  beforeEach(() => {
    trie = new CommandTrie();
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
      const handler: CommandHandler = async (_args: string[]) => new TextCommandResult('success');
      trie.addCommand([
          { type: 'word', name: 'parent' },
          { type: 'word', name: 'child' }
        ],
        'Child command',
        handler
      );

      
      const childNode = trie.getCommand(['parent', 'child']);
      expect(childNode?.description).toBe('Child command');
      expect(childNode?.handler).toBe(handler);
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
    beforeEach(() => {
      const handler: CommandHandler = async (_args: string[]) => new TextCommandResult('success');
      trie.addCommand(
        [{ type: 'word', name: 'help' }],
        'Help command',
        handler
      );
      trie.addCommand(
        [
          { type: 'word', name: 'user' },
          { type: 'word', name: 'create' }
        ],
        'Create user',
        handler
      );
      trie.addCommand(
        [
          { type: 'word', name: 'user' },
          { type: 'word', name: 'delete' }
        ],
        'Delete user',
        handler
      );
    });

    it('should return root level completions', () => {
      const completions = trie.getCompletions([]);
      expect(completions).toEqual(['help', 'user']);
    });

    it('should return nested completions', () => {
      const completions = trie.getCompletions(['user']);
      expect(completions).toEqual(['create', 'delete']);
    });

    it('should return empty array for invalid path', () => {
      const completions = trie.getCompletions(['invalid', 'path']);
      expect(completions).toEqual([]);
    });

    it('should return empty array for leaf command', () => {
      const completions = trie.getCompletions(['help']);
      expect(completions).toEqual([]);
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
