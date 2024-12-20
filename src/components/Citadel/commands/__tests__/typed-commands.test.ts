import { describe, it, expect } from 'vitest';
import { TypedCalculatorCommand } from '../typed-commands';
import { JsonCommandResult } from '../../types/command-results';

describe('TypedCalculatorCommand', () => {
  let calculator: TypedCalculatorCommand;

  beforeEach(() => {
    calculator = new TypedCalculatorCommand();
  });

  describe('argument parsing', () => {
    it('should parse valid arguments', () => {
      const args = calculator.parseArgs(['add', '1', '2', '3']);
      expect(args).toEqual({
        operation: 'add',
        numbers: [1, 2, 3]
      });
    });

    it('should throw on invalid operation', () => {
      expect(() => calculator.parseArgs(['invalid', '1', '2']))
        .toThrow('Invalid operation: invalid');
    });

    it('should throw on invalid numbers', () => {
      expect(() => calculator.parseArgs(['add', 'one', '2']))
        .toThrow('Invalid number: one');
    });

    it('should throw on insufficient arguments', () => {
      expect(() => calculator.parseArgs(['add']))
        .toThrow('Expected operation and at least one number');
    });
  });

  describe('argument validation', () => {
    it('should validate correct arguments', () => {
      expect(calculator.validateArgs({
        operation: 'add',
        numbers: [1, 2, 3]
      })).toBe(true);
    });

    it('should reject empty number array', () => {
      expect(calculator.validateArgs({
        operation: 'add',
        numbers: []
      })).toBe(false);
    });

    it('should reject invalid operation', () => {
      expect(calculator.validateArgs({
        operation: 'invalid' as any,
        numbers: [1, 2]
      })).toBe(false);
    });
  });

  describe('command execution', () => {
    it('should add numbers', async () => {
      const result = await calculator.executeTyped({
        operation: 'add',
        numbers: [1, 2, 3]
      });

      expect(result).toBeInstanceOf(JsonCommandResult);
      expect(result.data).toEqual({
        operation: 'add',
        numbers: [1, 2, 3],
        result: 6
      });
    });

    it('should multiply numbers', async () => {
      const result = await calculator.executeTyped({
        operation: 'multiply',
        numbers: [2, 3, 4]
      });

      expect(result.data).toEqual({
        operation: 'multiply',
        numbers: [2, 3, 4],
        result: 24
      });
    });

    it('should subtract numbers', async () => {
      const result = await calculator.executeTyped({
        operation: 'subtract',
        numbers: [10, 3, 2]
      });

      expect(result.data).toEqual({
        operation: 'subtract',
        numbers: [10, 3, 2],
        result: 5
      });
    });

    it('should divide numbers', async () => {
      const result = await calculator.executeTyped({
        operation: 'divide',
        numbers: [12, 3, 2]
      });

      expect(result.data).toEqual({
        operation: 'divide',
        numbers: [12, 3, 2],
        result: 2
      });
    });

    it('should throw on division by zero', async () => {
      await expect(calculator.executeTyped({
        operation: 'divide',
        numbers: [1, 0]
      })).rejects.toThrow('Division by zero');
    });

    it('should work with string arguments', async () => {
      const result = await calculator.execute(['add', '1', '2', '3']);
      expect(result.data).toEqual({
        operation: 'add',
        numbers: [1, 2, 3],
        result: 6
      });
    });
  });

  describe('metadata', () => {
    it('should have correct id and description', () => {
      expect(calculator.id).toBe('math.calculate');
      expect(calculator.description).toBe('Perform arithmetic operations');
    });

    it('should have argument schema', () => {
      expect(calculator.argument).toBeDefined();
      expect(calculator.argument!.name).toBe('expression');
      expect(calculator.argument!.schema).toEqual({
        type: 'object',
        properties: {
          numbers: {
            type: 'array',
            items: { type: 'number' }
          },
          operation: {
            type: 'string',
            enum: ['add', 'multiply', 'subtract', 'divide']
          }
        },
        required: ['numbers', 'operation']
      });
    });
  });
});
