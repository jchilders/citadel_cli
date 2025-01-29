import { describe, it, expect, beforeEach } from 'vitest';

import { CommandTrie, NoopHandler, CommandHandler, CommandDefinition, areCommandDefinitionsEqual } from '../command-trie';
import { TextCommandResult } from '../command-results';

describe('CommandTrie', () => {
  let trie: CommandTrie;

  beforeEach(() => {
    trie = new CommandTrie();
  });

  describe('addCommand', () => {
    it('should add leaf command successfully', () => {
      trie.addCommand({
        segments: [{ type: 'word', name: 'test' }],
        description: 'Test command'
      });

      const node = trie.getCommand(['test']);
      expect(node?.name).toBe('test');
      expect(node?.description).toBe('Test command');
      expect(node?.handler).toBe(NoopHandler);
      expect(node?.fullPath).toEqual(['test']);
    });

    it('should add nested commands successfully', () => {
      const handler: CommandHandler = async (_args: string[]) => new TextCommandResult('success');
      trie.addCommand({
        segments: [
          { type: 'word', name: 'parent' },
          { type: 'word', name: 'child' }
        ],
        description: 'Child command',
        handler
      });
      
      const parentNode = trie.getCommand(['parent']);
      expect(parentNode?.name).toBe('parent');
      expect(parentNode?.handler).toBe(NoopHandler);
      expect(parentNode?.children?.size).toBe(1);
      expect(parentNode?.fullPath).toEqual(['parent']);

      const childNode = trie.getCommand(['parent', 'child']);
      expect(childNode?.name).toBe('child');
      expect(childNode?.description).toBe('Child command');
      expect(childNode?.handler).toBe(handler);
      expect(childNode?.fullPath).toEqual(['parent', 'child']);
    });

    it('should throw on empty path', () => {
      expect(() => trie.addCommand({
        segments: [],
        description: 'Empty command'
      })).toThrow('Command path cannot be empty');
    });

    it('should throw on duplicate commands', () => {
      trie.addCommand({
        segments: [{ type: 'word', name: 'test' }],
        description: 'Test command'
      });
      expect(() => trie.addCommand({
        segments: [{ type: 'word', name: 'test' }],
        description: 'Duplicate test'
      })).toThrow('Duplicate command: test');
    });

    it('should throw on duplicate commands with an argument', () => {
      const cmd1: CommandDefinition = {
        segments: [
          { type: 'word' as const, name: 'test' },
          { type: 'argument' as const, name: 'arg1' }
        ]
      };
      const cmd2: CommandDefinition = {
        segments: [
          { type: 'word' as const, name: 'test' },
          { type: 'argument' as const, name: 'arg2' }
        ]
      };
      let result = areCommandDefinitionsEqual(cmd1, cmd2);
      expect(result).toBe(true);
      
      trie.addCommand({
        segments: [
          { type: 'word', name: 'test' },
          { type: 'argument', name: 'arg1' }
        ]
      });
      expect(() => trie.addCommand({
        segments: [
          { type: 'word', name: 'test' },
          { type: 'argument', name: 'arg2' }
        ]
      })).toThrow('Duplicate command: test arg2');
    });
  });

  describe('getLeafCommands', () => {
    it('should return all leaf commands', async () => {
      const handler1: CommandHandler = async (_args: string[]) => new TextCommandResult('success1');
      const handler2: CommandHandler = async (_args: string[]) => new TextCommandResult('success2');
      
      trie.addCommand({
        segments: [{ type: 'word', name: 'cmd1' }],
        description: 'Command 1',
        handler: handler1
      });
      trie.addCommand({
        segments: [
          { type: 'word', name: 'parent' },
          { type: 'word', name: 'cmd2' }
        ],
        description: 'Command 2',
        handler: handler2
      });

      const leaves = trie.getLeafCommands();
      expect(leaves).toHaveLength(2);
      
      const cmd1 = leaves.find(node => node.fullPath.join(' ') === 'cmd1');
      expect(cmd1?.description).toBe('Command 1');
      expect(cmd1?.handler).toBe(handler1);

      const cmd2 = leaves.find(node => node.fullPath.join(' ') === 'parent cmd2');
      expect(cmd2?.description).toBe('Command 2');
      expect(cmd2?.handler).toBe(handler2);
    });

    it('should return empty array for empty trie', () => {
      expect(trie.getLeafCommands()).toHaveLength(0);
    });
  });

  describe('areCommandDefinitionsEqual', () => {
    it('should consider commands with same word paths equal', () => {
      const def1 = {
        path: [
          { type: 'word' as const, name: 'test' },
          { type: 'word' as const, name: 'command' }
        ]
      };
      const def2 = {
        path: [
          { type: 'word' as const, name: 'test' },
          { type: 'word' as const, name: 'command' }
        ]
      };
      expect(areCommandDefinitionsEqual(def1, def2)).toBe(true);
    });

    it('should consider commands with different word paths not equal', () => {
      const def1 = {
        path: [
          { type: 'word' as const, name: 'test' },
          { type: 'word' as const, name: 'command1' }
        ]
      };
      const def2 = {
        path: [
          { type: 'word' as const, name: 'test' },
          { type: 'word' as const, name: 'command2' }
        ]
      };
      expect(areCommandDefinitionsEqual(def1, def2)).toBe(false);
    });

    it('should consider commands with same structure but different argument names equal', () => {
      const def1 = {
        path: [
          { type: 'word' as const, name: 'do' },
          { type: 'argument' as const, name: 'arg1' }
        ]
      };
      const def2 = {
        path: [
          { type: 'word' as const, name: 'do' },
          { type: 'argument' as const, name: 'arg2' }
        ]
      };
      expect(areCommandDefinitionsEqual(def1, def2)).toBe(true);
    });

    it('should consider commands with different structures not equal', () => {
      const def1 = {
        path: [
          { type: 'word' as const, name: 'do' },
          { type: 'argument' as const, name: 'arg1' }
        ]
      };
      const def2 = {
        path: [
          { type: 'word' as const, name: 'do' },
          { type: 'word' as const, name: 'something' }
        ]
      };
      expect(areCommandDefinitionsEqual(def1, def2)).toBe(false);
    });
    it('should consider commands with same args but different subcommands as not equal', () => {
      const def1 = {
        path: [
          { type: 'word' as const, name: 'do' },
          { type: 'argument' as const, name: 'arg1' },
          { type: 'word' as const, name: 'subcmd1' }
        ]
      };
      const def2 = {
        path: [
          { type: 'word' as const, name: 'do' },
          { type: 'argument' as const, name: 'arg1' },
          { type: 'word' as const, name: 'subcmd2' }
        ]
      };
      expect(areCommandDefinitionsEqual(def1, def2)).toBe(false);
    });
  });

  describe('validate', () => {
    it('should validate a valid trie', () => {
      const handler: CommandHandler = async (_args: string[]) => new TextCommandResult('success');
      trie.addCommand({
        segments: [{ type: 'word', name: 'cmd1' }],
        description: 'Command 1'
      });
      trie.addCommand({
        segments: [
          { type: 'word', name: 'parent' },
          { type: 'word', name: 'cmd2' }
        ],
        description: 'Command 2',
        handler
      });

      const { isValid, errors } = trie.validate();
      expect(isValid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('should throw when adding a leaf to a node with a handler (a leaf node)', () => {
      const handler: CommandHandler = async (_args: string[]) => new TextCommandResult('success');
      trie.addCommand({
        segments: [{ type: 'word', name: 'cmd1' }],
        description: 'Command 1',
        handler
      });
      expect(() => trie.addCommand({
        segments: [
          { type: 'word', name: 'cmd1' },
          { type: 'word', name: 'subcommand1' }
        ],
        description: 'cmd1 subcommand12',
        handler
      })).toThrow(/^Cannot add subcommand to leaf command: /);
    });
  });

  describe('getCompletions', () => {
    beforeEach(() => {
      const handler: CommandHandler = async (_args: string[]) => new TextCommandResult('success');
      trie.addCommand({
        segments: [{ type: 'word', name: 'help' }],
        description: 'Help command',
        handler
      });
      trie.addCommand({
        segments: [
          { type: 'word', name: 'user' },
          { type: 'word', name: 'create' }
        ],
        description: 'Create user',
        handler
      });
      trie.addCommand({
        segments: [
          { type: 'word', name: 'user' },
          { type: 'word', name: 'delete' }
        ],
        description: 'Delete user',
        handler
      });
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
      it('should return empty array for root node', () => {
        const root = new CommandTrie()['_root'];
        expect(root.fullPath).toEqual([]);
      });

      it('should return correct path for single-level command', () => {
        trie.addCommand({
          segments: [{ type: 'word', name: 'test' }]
        });
        const node = trie.getCommand(['test']);
        expect(node?.fullPath).toEqual(['test']);
      });

      it('should return correct path for nested command', () => {
        trie.addCommand({
          segments: [
            { type: 'word', name: 'parent' },
            { type: 'word', name: 'child' },
            { type: 'word', name: 'grandchild' }
          ]
        });
        const node = trie.getCommand(['parent', 'child', 'grandchild']);
        expect(node?.fullPath).toEqual(['parent', 'child', 'grandchild']);
      });

      it('should return correct path for command with arguments', () => {
        trie.addCommand({
          segments: [
            { type: 'word', name: 'command' },
            { type: 'argument', name: 'arg1' },
            { type: 'word', name: 'subcommand' }
          ]
        });
        const node = trie.getCommand(['command', '*', 'subcommand']);
        expect(node?.fullPath).toEqual(['command', '*', 'subcommand']);
      });
    });
  });
});
