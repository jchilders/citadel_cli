import { describe, it, expect, beforeEach } from 'vitest';
import { CommandTrie, CommandNode } from '../command-trie';

describe('CommandTrie', () => {
  let trie: CommandTrie;

  beforeEach(() => {
    trie = new CommandTrie();
  });

  describe('addCommand', () => {
    it('should add a leaf command successfully', () => {
      const handler = async () => ({ text: 'success' });
      trie.addCommand({
        path: ['test'],
        description: 'Test command',
        handler
      });
      
      const node = trie.getCommand(['test']);
      expect(node).toBeDefined();
      expect(node?.getName()).toBe('test');
      expect(node?.getDescription()).toBe('Test command');
      expect(node?.getHandler()).toBe(handler);
      expect(node?.getFullPath()).toEqual(['test']);
    });

    it('should add nested commands successfully', () => {
      const handler = async () => ({ text: 'success' });
      trie.addCommand({
        path: ['parent', 'child'],
        description: 'Child command',
        handler
      });
      
      const parentNode = trie.getCommand(['parent']);
      expect(parentNode?.getName()).toBe('parent');
      expect(parentNode?.getDescription()).toBe('parent commands');
      expect(parentNode?.getHandler()).toBeUndefined();
      expect(parentNode?.getChildren()?.size).toBe(1);
      expect(parentNode?.getFullPath()).toEqual(['parent']);

      const childNode = trie.getCommand(['parent', 'child']);
      expect(childNode?.getName()).toBe('child');
      expect(childNode?.getDescription()).toBe('Child command');
      expect(childNode?.getHandler()).toBe(handler);
      expect(childNode?.getFullPath()).toEqual(['parent', 'child']);
    });

    it('should throw on empty path', () => {
      expect(() => trie.addCommand({
        path: [],
        description: 'Empty command'
      })).toThrow('Command path cannot be empty');
    });

    it('should throw on duplicate leaf command', () => {
      trie.addCommand({
        path: ['test'],
        description: 'Test command'
      });
      expect(() => trie.addCommand({
        path: ['test'],
        description: 'Duplicate test'
      })).toThrow('Duplicate leaf command: test');
    });

    it('should throw when adding subcommand to leaf', () => {
      trie.addCommand({
        path: ['leaf'],
        description: 'Leaf command'
      });
      expect(() => trie.addCommand({
        path: ['leaf', 'sub'],
        description: 'Sub command'
      })).toThrow('Cannot add subcommand to leaf command: leaf');
    });
  });

  describe('getLeafCommands', () => {
    it('should return all leaf commands', async () => {
      const handler1 = async () => ({ text: 'success1' });
      const handler2 = async () => ({ text: 'success2' });
      
      trie.addCommand({
        path: ['cmd1'],
        description: 'Command 1',
        handler: handler1
      });
      trie.addCommand({
        path: ['parent', 'cmd2'],
        description: 'Command 2',
        handler: handler2,
        argument: { name: 'arg', description: 'test arg' }
      });

      const leaves = trie.getLeafCommands();
      expect(leaves).toHaveLength(2);
      
      const cmd1 = leaves.find(node => node.getFullPath().join(' ') === 'cmd1');
      expect(cmd1?.getDescription()).toBe('Command 1');
      expect(cmd1?.getArgument()).toBeUndefined();

      const cmd2 = leaves.find(node => node.getFullPath().join(' ') === 'parent cmd2');
      expect(cmd2?.getDescription()).toBe('Command 2');
      expect(cmd2?.getArgument()?.name).toBe('arg');
    });

    it('should return empty array for empty trie', () => {
      expect(trie.getLeafCommands()).toHaveLength(0);
    });
  });

  describe('validate', () => {
    it('should validate a valid trie', () => {
      const handler = async () => ({ text: 'success' });
      trie.addCommand({
        path: ['cmd1'],
        description: 'Command 1',
        handler
      });
      trie.addCommand({
        path: ['parent', 'cmd2'],
        description: 'Command 2',
        handler
      });

      const { isValid, errors } = trie.validate();
      expect(isValid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing handlers', () => {
      trie.addCommand({
        path: ['cmd'],
        description: 'Command without handler'
      });

      const { isValid, errors } = trie.validate();
      expect(isValid).toBe(false);
      expect(errors).toContain('Leaf command missing handler: cmd');
    });

    it('should detect invalid handler on non-leaf', () => {
      const handler = async () => ({ text: 'success' });
      
      // First add a valid parent command
      trie.addCommand({
        path: ['parent'],
        description: 'Parent command'
      });

      // Then manually modify it to create an invalid state with both handler and children
      const parentNode = trie.getCommand(['parent']);
      if (parentNode) {
        Object.assign(parentNode, {
          handler,
          children: new Map([
            ['child', new CommandNode({
              description: 'Child command',
              fullPath: ['parent', 'child']
            })]
          ])
        });
      }

      const { isValid, errors } = trie.validate();
      expect(isValid).toBe(false);
      expect(errors).toContain('Non-leaf command cannot have handler: parent');
    });
  });

  describe('getCompletions', () => {
    beforeEach(() => {
      const handler = async () => ({ text: 'success' });
      trie.addCommand({
        path: ['help'],
        description: 'Help command',
        handler
      });
      trie.addCommand({
        path: ['user', 'create'],
        description: 'Create user',
        handler
      });
      trie.addCommand({
        path: ['user', 'delete'],
        description: 'Delete user',
        handler
      });
    });

    it('should return root completions for empty path', () => {
      const completions = trie.getCompletions([]);
      expect(completions).toEqual(['help', 'user']);
    });

    it('should return matching completions for partial path', () => {
      const completions = trie.getCompletions(['user']);
      expect(completions).toEqual(['create', 'delete']);
    });

    it('should return filtered completions for partial segment', () => {
      const completions = trie.getCompletions(['us']);
      expect(completions).toEqual(['user']);
    });

    it('should return empty array for non-existent path', () => {
      const completions = trie.getCompletions(['nonexistent']);
      expect(completions).toHaveLength(0);
    });
  });

  describe('getAllCommands', () => {
    it('should return all command paths', () => {
      const handler = async () => ({ text: 'success' });
      trie.addCommand({
        path: ['cmd1'],
        description: 'Command 1',
        handler
      });
      trie.addCommand({
        path: ['parent', 'cmd2'],
        description: 'Command 2',
        handler
      });

      const paths = trie.getAllCommands();
      expect(paths).toHaveLength(3); // cmd1, parent, parent cmd2
      expect(paths).toContainEqual(['cmd1']);
      expect(paths).toContainEqual(['parent']);
      expect(paths).toContainEqual(['parent', 'cmd2']);
    });

    it('should return empty array for empty trie', () => {
      expect(trie.getAllCommands()).toHaveLength(0);
    });
  });
});
