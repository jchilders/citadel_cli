import { describe, it, expect, beforeEach } from 'vitest';
import { CommandTrie, NoopHandler, CommandNode } from '../command-trie';

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
      expect(node?.name).toBe('test');
      expect(node?.description).toBe('Test command');
      expect(node?.handler).toBe(handler);
      expect(node?.fullPath).toEqual(['test']);
    });

    it('should add nested commands successfully', () => {
      const handler = async () => ({ text: 'success' });
      trie.addCommand({
        path: ['parent', 'child'],
        description: 'Child command',
        handler
      });
      
      const parentNode = trie.getCommand(['parent']);
      expect(parentNode?.name).toBe('parent');
      expect(parentNode?.description).toBe('parent commands');
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
      
      const cmd1 = leaves.find(node => node.fullPath.join(' ') === 'cmd1');
      expect(cmd1?.description).toBe('Command 1');
      expect(cmd1?.argument).toBeUndefined();
      expect(cmd1?.handler).toBe(handler1);

      const cmd2 = leaves.find(node => node.fullPath.join(' ') === 'parent cmd2');
      expect(cmd2?.description).toBe('Command 2');
      expect(cmd2?.argument).toEqual({ name: 'arg', description: 'test arg' });
      expect(cmd2?.handler).toBe(handler2);
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

    it('should detect non-NoopHandler on non-leaf nodes', () => {
      const handler = async () => ({ text: 'success' });
      
      // Create a parent node directly with a custom handler
      const parentNode = new CommandNode({
        fullPath: ['parent'],
        description: 'Parent command',
        handler
      });
      
      // Create a child node
      const childNode = new CommandNode({
        fullPath: ['parent', 'child'],
        description: 'Child command',
        handler,
        parent: parentNode
      });
      
      // Set up the hierarchy manually
      parentNode.addChild('child', childNode);
      trie['_root'].addChild('parent', parentNode);

      const { isValid, errors } = trie.validate();
      expect(isValid).toBe(false);
      expect(errors).toContain('Non-leaf command should use NoopHandler: parent');
    });

    it('should detect argument on non-leaf node', () => {
      const handler = async () => ({ text: 'success' });
      
      // Create a parent node directly with an argument
      const parentNode = new CommandNode({
        fullPath: ['parent'],
        description: 'Parent command',
        handler: NoopHandler,
        argument: { name: 'arg', description: 'test arg' }
      });
      
      // Create a child node
      const childNode = new CommandNode({
        fullPath: ['parent', 'child'],
        description: 'Child command',
        handler,
        parent: parentNode
      });
      
      // Set up the hierarchy manually
      parentNode.addChild('child', childNode);
      trie['_root'].addChild('parent', parentNode);

      const { isValid, errors } = trie.validate();
      expect(isValid).toBe(false);
      expect(errors).toContain('Non-leaf command cannot have argument: parent');
    });

    it('should detect duplicate command paths', () => {
      const handler = async () => ({ text: 'success' });
      
      // Add commands through different paths that end up with the same full path
      trie.addCommand({
        path: ['cmd'],
        description: 'Command 1',
        handler
      });
      
      // Add a second command that will create the same path through a different route
      trie.addCommand({
        path: ['other', 'cmd'],
        description: 'Command 2',
        handler
      });
      
      // Now manually move the second command to create a duplicate
      const cmd2 = trie.getCommand(['other', 'cmd']);
      if (cmd2) {
        trie['_root'].addChild('cmd', cmd2);
      }

      const { isValid, errors } = trie.validate();
      expect(isValid).toBe(false);
      expect(errors).toContain('Duplicate command path: other cmd');
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
