import { describe, it, expect, beforeEach } from 'vitest';
import { CommandTestKit } from '../CommandTestKit';
import { TextCommandResult } from '../../types/command-results';

describe('CommandTestKit', () => {
  let testKit: CommandTestKit;

  beforeEach(() => {
    testKit = new CommandTestKit();
  });

  describe('mock commands', () => {
    it('should create mock commands', () => {
      const mock = testKit.mockCommand('test', 'Test command');
      expect(mock.getName()).toBe('test');
      expect(mock.description).toBe('Test command');
    });

    it('should track mock command calls', async () => {
      const mock = testKit.mockCommand('test');
      await mock.execute(['arg1', 'arg2']);
      
      const history = mock.getCallHistory();
      expect(history).toHaveLength(1);
      expect(history[0].args).toEqual(['arg1', 'arg2']);
    });

    it('should support mock implementations', async () => {
      const mock = testKit.mockCommand('test');
      const result = new TextCommandResult('Custom result');
      
      mock.mockImplementation(async () => result);
      const output = await mock.execute([]);
      
      expect(output).toBe(result);
    });

    it('should support mock return values', async () => {
      const mock = testKit.mockCommand('test');
      const result = new TextCommandResult('Test result');
      
      mock.mockReturnValue(result);
      const output = await mock.execute([]);
      
      expect(output).toBe(result);
    });

    it('should support mock rejections', async () => {
      const mock = testKit.mockCommand('test');
      const error = new Error('Test error');
      
      mock.mockRejectedValue(error);
      await expect(mock.execute([])).rejects.toThrow(error);
    });
  });

  describe('test context', () => {
    it('should create test context with defaults', () => {
      const context = testKit.createTestContext();
      expect(context.environment).toEqual({});
      expect(context.mocks).toEqual({});
      expect(context.config).toEqual({});
    });

    it('should merge test context overrides', () => {
      const context = testKit.createTestContext({
        mocks: { test: 'value' },
        config: { timeout: 1000 }
      });

      expect(context.mocks).toEqual({ test: 'value' });
      expect(context.config).toEqual({ timeout: 1000 });
    });
  });

  describe('command execution', () => {
    it('should execute commands with test context', async () => {
      const mock = testKit.mockCommand('test');
      const context = testKit.createTestContext({
        mocks: { test: 'value' }
      });

      await testKit.executeCommand(mock, ['test'], context);
      
      const history = mock.getCallHistory();
      expect(history[0].context?.mocks).toEqual({ test: 'value' });
    });

    it('should track command metrics', async () => {
      const mock = testKit.mockCommand('test');
      await testKit.executeCommand(mock, ['test']);
      
      const metrics = testKit.getMetrics('test');
      expect(metrics.callCount).toBe(1);
      expect(metrics.executionTime).toBeGreaterThan(0);
      expect(metrics.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('result matching', () => {
    it('should match text results', () => {
      const result = new TextCommandResult('Test output');
      const matcher = testKit.resultMatches('Test output');
      
      expect(matcher.matches(result)).toBe(true);
    });

    it('should match command results', () => {
      const expected = new TextCommandResult('Test');
      const actual = new TextCommandResult('Test');
      const matcher = testKit.resultMatches(expected);
      
      expect(matcher.matches(actual)).toBe(true);
    });

    it('should provide descriptive messages', () => {
      const matcher = testKit.resultMatches('expected');
      expect(matcher.describe()).toContain('expected');
    });
  });

  describe('assertions', () => {
    it('should assert command output', () => {
      const result = new TextCommandResult('Test output');
      
      expect(() => {
        testKit.assertCommandOutput(result, 'Test output');
      }).not.toThrow();
    });

    it('should throw on mismatched output', () => {
      const result = new TextCommandResult('Actual');
      
      expect(() => {
        testKit.assertCommandOutput(result, 'Expected');
      }).toThrow();
    });
  });

  describe('reset', () => {
    it('should reset metrics and mocks', async () => {
      const mock = testKit.mockCommand('test');
      await testKit.executeCommand(mock, ['test']);
      
      testKit.reset();
      
      expect(() => testKit.getMetrics('test')).toThrow();
      expect(mock.getCallHistory()).toHaveLength(0);
    });
  });
});
