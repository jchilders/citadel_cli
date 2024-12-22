import { describe, it, expect } from 'vitest';
import {
  validateCommandId,
  validateCommandArguments,
  sanitizeCommandId,
  CommandValidationError
} from '../command-validation';

describe('Command Validation', () => {
  describe('validateCommandId', () => {
    it('should accept valid command IDs', () => {
      const validIds = [
        'system.echo',
        'math.add',
        'service.deploy.prod',
        'a.b.c'
      ];

      validIds.forEach(id => {
        expect(() => validateCommandId(id)).not.toThrow();
      });
    });

    it('should reject invalid command IDs', () => {
      const invalidIds = [
        '',                    // empty
        'noCategory',          // no dot
        'system..echo',        // consecutive dots
        'system.echo.',        // trailing dot
        '.system.echo',        // leading dot
        'system.echo!',        // invalid characters
        'system.echo space'    // spaces
      ];

      invalidIds.forEach(id => {
        expect(() => validateCommandId(id)).toThrow(CommandValidationError);
      });
    });
  });

  describe('validateCommandArguments', () => {
    it('should accept valid arguments', () => {
      expect(() => validateCommandArguments(['arg1', 'arg2'], 2)).not.toThrow();
      expect(() => validateCommandArguments([])).not.toThrow();
    });

    it('should reject invalid arguments', () => {
      expect(() => validateCommandArguments(['arg1'], 2))
        .toThrow(CommandValidationError);
      expect(() => validateCommandArguments('not-an-array' as any))
        .toThrow(CommandValidationError);
    });
  });

  describe('sanitizeCommandId', () => {
    it('should sanitize invalid command IDs', () => {
      const cases = [
        ['command with spaces', 'command.command_with_spaces'],
        ['invalid!@#chars', 'command.invalid___chars'],
        ['already.valid', 'already.valid'],
        ['no-category', 'command.no_category'],
        ['multiple...dots', 'multiple.dots'],
        ['.leading.dot', 'leading.dot'],
        ['trailing.dot.', 'trailing.dot'],
      ];

      cases.forEach(([input, expected]) => {
        expect(sanitizeCommandId(input)).toBe(expected);
      });
    });
  });
});
