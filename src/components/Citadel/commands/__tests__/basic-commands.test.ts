import { describe, it, expect } from 'vitest';
import { EchoCommand, HelpCommand, CalculatorCommand } from '../basic-commands';
import { TextCommandResult, JsonCommandResult } from '../../types/command-results';

describe('Basic Commands', () => {
  describe('EchoCommand', () => {
    it('should echo back input', async () => {
      const cmd = new EchoCommand();
      const result = await cmd.execute(['hello', 'world']);
      expect(result).toBeInstanceOf(TextCommandResult);
      expect(result.text).toBe('hello world');
    });

    it('should handle empty input', async () => {
      const cmd = new EchoCommand();
      const result = await cmd.execute([]);
      expect(result.text).toBe('');
    });

    it('should have correct metadata', () => {
      const cmd = new EchoCommand();
      expect(cmd.id).toBe('system.echo');
      expect(cmd.description).toBe('Echo back the input');
      expect(cmd.argument).toEqual({
        name: 'message',
        description: 'Message to echo back'
      });
    });
  });

  describe('HelpCommand', () => {
    it('should return placeholder message', async () => {
      const cmd = new HelpCommand();
      const result = await cmd.execute(['test']);
      expect(result).toBeInstanceOf(TextCommandResult);
      expect(result.text).toBe('Help system not yet implemented');
    });

    it('should have correct metadata', () => {
      const cmd = new HelpCommand();
      expect(cmd.id).toBe('system.help');
      expect(cmd.description).toBe('Display help information');
      expect(cmd.argument).toEqual({
        name: 'command',
        description: 'Command to get help for'
      });
    });
  });

  describe('CalculatorCommand', () => {
    it('should add numbers', async () => {
      const cmd = new CalculatorCommand();
      const result = await cmd.execute(['1', '2', '3']);
      expect(result).toBeInstanceOf(JsonCommandResult);
      expect(result.json).toEqual({ result: 6 });
    });

    it('should handle empty input', async () => {
      const cmd = new CalculatorCommand();
      const result = await cmd.execute([]);
      expect(result.json).toEqual({ result: 0 });
    });

    it('should handle invalid numbers', async () => {
      const cmd = new CalculatorCommand();
      await expect(cmd.execute(['1', 'abc', '3'])).rejects.toThrow();
    });

    it('should have correct metadata', () => {
      const cmd = new CalculatorCommand();
      expect(cmd.id).toBe('math.add');
      expect(cmd.description).toBe('Add a list of numbers');
      expect(cmd.argument).toEqual({
        name: 'numbers',
        description: 'Space-separated numbers to add'
      });
    });
  });
});
