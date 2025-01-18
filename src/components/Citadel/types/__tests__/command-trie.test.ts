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
      trie.addCommand({
        path: ['test'],
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
        path: ['parent', 'child'],
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
      })).toThrow('Duplicate command: test');
    });
  });

  describe('getLeafCommands', () => {
    it('should return all leaf commands', async () => {
      const handler1: CommandHandler = async (_args: string[]) => new TextCommandResult('success1');
      const handler2: CommandHandler = async (_args: string[]) => new TextCommandResult('success2');
      
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
      const handler: CommandHandler = async (_args: string[]) => new TextCommandResult('success');
      trie.addCommand({
        path: ['cmd1'],
        description: 'Command 1'
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

    it('should throw when adding a leaf to a node with a handler (a leaf node)', () => {
      const handler: CommandHandler = async (_args: string[]) => new TextCommandResult('success');
      trie.addCommand({
        path: ['cmd1'],
        description: 'Command 1',
        handler
      });
      expect(() => trie.addCommand({
        path: ['cmd1', 'subcommand1'],
        description: 'cmd1 subcommand12',
        handler
      })).toThrow(/^Cannot add subcommand to leaf command: /);
    });
  });

  describe('getCompletions', () => {
    beforeEach(() => {
      const handler: CommandHandler = async (_args: string[]) => new TextCommandResult('success');
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

  describe('getCommandBySignature', () => {
    beforeEach(() => {
      // Add some test commands
      trie.addCommand({
        path: ['image', 'random', 'cat'],
        description: 'Get a random cat image'
      });
      trie.addCommand({
        path: ['image', 'random', 'dog'],
        description: 'Get a random dog image'
      });
      trie.addCommand({
        path: ['user', 'show'],
        description: 'Show user details'
      });
      trie.addCommand({
        path: ['user', 'status'],
        description: 'Get user status'
      });
    });

    it('should find command with exact signatures', () => {
      const cmd = trie.getCommandBySignature({ signature: ['image', 'random', 'cat'] });
      expect(cmd?.fullPath).toEqual(['image', 'random', 'cat']);
    });

    it('should find command with minimal unique prefixes', () => {
      const cmd = trie.getCommandBySignature({ signature: ['i', 'r', 'c'] });
      expect(cmd?.fullPath).toEqual(['image', 'random', 'cat']);
    });

    it('should handle ambiguous prefixes', () => {
      // 'u' is unique for 'user', but 's' is ambiguous (show/status)
      const cmd = trie.getCommandBySignature({ signature: ['u', 's'] });
      expect(cmd).toBeUndefined();
    });

    it('should require longer prefix to disambiguate commands', () => {
      // 'sh' uniquely identifies 'show' vs 'status'
      const cmd = trie.getCommandBySignature({ signature: ['u', 'sh'] });
      expect(cmd?.fullPath).toEqual(['user', 'show']);
    });

    it('should return undefined for invalid signatures', () => {
      expect(trie.getCommandBySignature({ signature: ['x', 'y', 'z'] })).toBeUndefined();
      expect(trie.getCommandBySignature({ signature: [] })).toBeUndefined();
      expect(trie.getCommandBySignature({ signature: [''] })).toBeUndefined();
    });

    it('should handle case insensitive matching', () => {
      const cmd = trie.getCommandBySignature({ signature: ['I', 'R', 'C'] });
      expect(cmd?.fullPath).toEqual(['image', 'random', 'cat']);
    });
  });

  describe('getSignatureForCommand', () => {
    it('should generate minimal unique signatures', () => {
      trie.addCommand({
        path: ['image', 'random', 'cat'],
        description: 'random cat pic'
      });

      const catCommand = trie.getCommand(['image', 'random', 'cat']);
      expect(catCommand).toBeDefined();
      const signature = trie.getSignatureForCommand(catCommand!);
      expect(signature).toEqual({ signature: ['i', 'r', 'c'] });
    });

    it('should use longer prefixes when needed for uniqueness', () => {
      trie.addCommand({
        path: ['user', 'show'], description: 'show user'
      });
      trie.addCommand({
        path: ['user', 'status'], description: 'user status'
      });
      const showCommand = trie.getCommand(['user', 'show']);
      expect(showCommand).toBeDefined();
      const signature = trie.getSignatureForCommand(showCommand!);
      expect(signature).toEqual({ signature: ['u', 'sh'] });
    });

    it('should generate signatures that work with getCommandBySignature', () => {
      const testCases = [
        ['image', 'random', 'cat'],
        ['image', 'random', 'dog'],
        ['user', 'show'],
        ['user', 'status']
      ];
      for (const path of testCases) {
        trie.addCommand({path: path, description: path.join(' ')});
      }

      for (const path of testCases) {
        const command = trie.getCommand(path);
        expect(command).toBeDefined();
        const signature = trie.getSignatureForCommand(command!);
        const foundCommand = trie.getCommandBySignature(signature);
        expect(foundCommand).toBeDefined();
        expect(foundCommand!.fullPath).toEqual(path);
      }
    });

    it('should handle full segments when no shorter unique prefix exists', () => {
      // Add commands that would require full segment names
      trie.addCommand({
        path: ['show'],
        description: 'Show command'
      });
      trie.addCommand({
        path: ['shop'],
        description: 'Shop command'
      });

      const showCommand = trie.getCommand(['show']);
      expect(showCommand).toBeDefined();
      const signature = trie.getSignatureForCommand(showCommand!);
      expect(signature).toEqual({ signature: ['show'] });
    });

    it('should return empty array for root node', () => {
      const signature = trie.getSignatureForCommand(trie['_root']);
      expect(signature).toEqual({ signature: [] });
    });

    it('should handle undefined command node', () => {
      const signature = trie.getSignatureForCommand(undefined as any);
      expect(signature).toEqual({ signature: [] });
    });
  });
});
