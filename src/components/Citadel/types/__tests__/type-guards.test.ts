import { describe, it, expect } from 'vitest';
import { CommandNode, CommandResult } from '../command-trie';
import {
  isCommandResult,
  isCommandArgument,
  isCommandHandler,
  isCommandNode,
  isExecutableCommand,
  hasJsonResult,
  hasTextResult,
  requiresArgument,
} from '../type-guards';

describe('Type Guards', () => {
  describe('isCommandResult', () => {
    it('should validate valid command results', () => {
      expect(isCommandResult({ text: 'test' })).toBe(true);
      expect(isCommandResult({ json: { data: 'test' } })).toBe(true);
      expect(isCommandResult({ text: 'test', json: { data: 'test' } })).toBe(true);
    });

    it('should reject invalid command results', () => {
      expect(isCommandResult(null)).toBe(false);
      expect(isCommandResult(undefined)).toBe(false);
      expect(isCommandResult({ text: 123 })).toBe(false);
      expect(isCommandResult({ json: 'not an object' })).toBe(false);
    });
  });

  describe('isCommandArgument', () => {
    it('should validate valid command arguments', () => {
      expect(isCommandArgument({ name: 'test', description: 'test desc' })).toBe(true);
    });

    it('should reject invalid command arguments', () => {
      expect(isCommandArgument(null)).toBe(false);
      expect(isCommandArgument(undefined)).toBe(false);
      expect(isCommandArgument({ name: '', description: 'test' })).toBe(false);
      expect(isCommandArgument({ name: 'test', description: '' })).toBe(false);
    });
  });

  describe('isCommandHandler', () => {
    it('should validate valid command handlers', () => {
      const syncHandler = () => ({ text: 'test' });
      const asyncHandler = async () => ({ text: 'test' });
      expect(isCommandHandler(syncHandler)).toBe(true);
      expect(isCommandHandler(asyncHandler)).toBe(true);
    });

    it('should reject invalid command handlers', () => {
      expect(isCommandHandler(null)).toBe(false);
      expect(isCommandHandler(undefined)).toBe(false);
      expect(isCommandHandler('not a function')).toBe(false);
      expect(isCommandHandler({})).toBe(false);
    });
  });

  describe('isCommandNode', () => {
    it('should validate CommandNode instances', () => {
      const node = new CommandNode({
        fullPath: ['test'],
        description: 'test command'
      });
      expect(isCommandNode(node)).toBe(true);
    });

    it('should reject non-CommandNode values', () => {
      expect(isCommandNode(null)).toBe(false);
      expect(isCommandNode(undefined)).toBe(false);
      expect(isCommandNode({})).toBe(false);
      expect(isCommandNode({ name: 'test' })).toBe(false);
    });
  });

  describe('isExecutableCommand', () => {
    it('should validate executable commands', () => {
      const node = new CommandNode({
        fullPath: ['test'],
        description: 'test command',
        handler: () => ({ text: 'test' })
      });
      expect(isExecutableCommand(node)).toBe(true);
    });

    it('should reject non-executable commands', () => {
      const node = new CommandNode({
        fullPath: ['test'],
        description: 'test command'
      });
      expect(isExecutableCommand(node)).toBe(false);

      const parentNode = new CommandNode({
        fullPath: ['parent'],
        description: 'parent command'
      });
      const childNode = new CommandNode({
        fullPath: ['parent', 'child'],
        description: 'child command',
        parent: parentNode
      });
      parentNode.addChild('child', childNode);
      expect(isExecutableCommand(parentNode)).toBe(false);
    });
  });

  describe('hasJsonResult', () => {
    it('should validate results with JSON data', () => {
      const result: CommandResult = { json: { data: 'test' } };
      expect(hasJsonResult(result)).toBe(true);
    });

    it('should reject results without JSON data', () => {
      const result: CommandResult = { text: 'test' };
      expect(hasJsonResult(result)).toBe(false);
    });
  });

  describe('hasTextResult', () => {
    it('should validate results with text output', () => {
      const result: CommandResult = { text: 'test' };
      expect(hasTextResult(result)).toBe(true);
    });

    it('should reject results without text output', () => {
      const result: CommandResult = { json: { data: 'test' } };
      expect(hasTextResult(result)).toBe(false);
    });
  });

  describe('requiresArgument', () => {
    it('should validate nodes requiring arguments', () => {
      const node = new CommandNode({
        fullPath: ['test'],
        description: 'test command',
        argument: { name: 'arg', description: 'test arg' }
      });
      expect(requiresArgument(node)).toBe(true);
    });

    it('should reject nodes not requiring arguments', () => {
      const node = new CommandNode({
        fullPath: ['test'],
        description: 'test command'
      });
      expect(requiresArgument(node)).toBe(false);
    });
  });
});
