import { describe, it, expect, beforeEach } from 'vitest';
import { CommandValidator } from '../CommandValidator';
import { ValidationSchema } from '../../types/command-validation';

describe('CommandValidator', () => {
  let validator: CommandValidator;

  beforeEach(() => {
    validator = new CommandValidator();
  });

  describe('positional arguments', () => {
    it('should validate required arguments', async () => {
      const schema: ValidationSchema = {
        args: [
          { name: 'first', type: 'string', required: true },
          { name: 'second', type: 'string', required: true }
        ]
      };

      const result = await validator.validate(['one'], schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('second');
      expect(result.errors[0].rule).toBe('required');
    });

    it('should validate argument types', async () => {
      const schema: ValidationSchema = {
        args: [
          { name: 'number', type: 'number' },
          { name: 'boolean', type: 'boolean' },
          { name: 'array', type: 'array' }
        ]
      };

      const result = await validator.validate(
        ['123', 'true', 'a,b,c'],
        schema
      );
      expect(result.valid).toBe(true);
      expect(result.parsed?.args).toEqual([123, true, ['a', 'b', 'c']]);
    });

    it('should validate enum values', async () => {
      const schema: ValidationSchema = {
        args: [
          { name: 'color', type: 'string', enum: ['red', 'green', 'blue'] }
        ]
      };

      const result = await validator.validate(['yellow'], schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].rule).toBe('enum');
    });

    it('should validate number ranges', async () => {
      const schema: ValidationSchema = {
        args: [
          { name: 'age', type: 'number', min: 0, max: 120 }
        ]
      };

      const result = await validator.validate(['150'], schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].rule).toBe('max');
    });

    it('should validate string patterns', async () => {
      const schema: ValidationSchema = {
        args: [
          { name: 'email', type: 'string', pattern: '^\\S+@\\S+\\.\\S+$' }
        ]
      };

      const result = await validator.validate(['invalid-email'], schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].rule).toBe('pattern');
    });
  });

  describe('named options', () => {
    it('should validate required options', async () => {
      const schema: ValidationSchema = {
        options: {
          name: { type: 'string', required: true }
        }
      };

      const result = await validator.validate(['--other', 'value'], schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('other');
      expect(result.errors[0].rule).toBe('unknown');
    });

    it('should validate option types', async () => {
      const schema: ValidationSchema = {
        options: {
          count: { type: 'number' },
          flag: { type: 'boolean' },
          tags: { type: 'array' }
        }
      };

      const result = await validator.validate([
        '--count', '42',
        '--flag', 'true',
        '--tags', 'one,two,three'
      ], schema);

      expect(result.valid).toBe(true);
      expect(result.parsed?.options).toEqual({
        count: 42,
        flag: true,
        tags: ['one', 'two', 'three']
      });
    });

    it('should handle unknown options', async () => {
      const schema: ValidationSchema = {
        options: {
          known: { type: 'string' }
        },
        allowUnknown: false
      };

      const result = await validator.validate(['--unknown', 'value'], schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].rule).toBe('unknown');
    });

    it('should allow unknown options when configured', async () => {
      const schema: ValidationSchema = {
        options: {
          known: { type: 'string' }
        },
        allowUnknown: true
      };

      const result = await validator.validate(['--unknown', 'value'], schema);
      expect(result.valid).toBe(true);
    });
  });

  describe('custom validation', () => {
    it('should support custom validation functions', async () => {
      const schema: ValidationSchema = {
        args: [{
          name: 'custom',
          type: 'string',
          validate: value => value.length % 2 === 0
        }]
      };

      const result = await validator.validate(['odd'], schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].rule).toBe('custom');
    });

    it('should support custom validation rules', async () => {
      validator.addRule('uppercase', value => 
        typeof value === 'string' && value === value.toUpperCase()
      );

      const schema: ValidationSchema = {
        args: [{ name: 'text', type: 'uppercase' }]
      };

      const result = await validator.validate(['lowercase'], schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].rule).toBe('uppercase');
    });

    it('should support schema-level validation', async () => {
      const schema: ValidationSchema = {
        args: [
          { name: 'min', type: 'number' },
          { name: 'max', type: 'number' }
        ],
        validate: args => {
          const [min, max] = args.map(Number);
          return min <= max;
        }
      };

      const result = await validator.validate(['10', '5'], schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].rule).toBe('custom');
    });
  });

  describe('error handling', () => {
    it('should handle type conversion errors', async () => {
      const schema: ValidationSchema = {
        args: [{ name: 'number', type: 'number' }]
      };

      const result = await validator.validate(['not-a-number'], schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].rule).toBe('parse');
    });

    it('should handle custom validation errors', async () => {
      const schema: ValidationSchema = {
        args: [{
          name: 'value',
          type: 'string',
          validate: () => { throw new Error('Custom error'); }
        }]
      };

      const result = await validator.validate(['test'], schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].rule).toBe('parse');
      expect(result.errors[0].message).toBe('Custom error');
    });

    it('should provide error details', async () => {
      const schema: ValidationSchema = {
        args: [{
          name: 'age',
          type: 'number',
          min: 0,
          max: 120,
          message: 'Age must be between 0 and 120'
        }]
      };

      const result = await validator.validate(['150'], schema);
      expect(result.errors[0]).toEqual({
        field: 'age',
        message: 'Age must be between 0 and 120',
        rule: 'max',
        value: '150'
      });
    });
  });
});
