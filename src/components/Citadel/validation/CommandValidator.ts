import {
  ValidationRule,
  ValidationSchema,
  ValidationError,
  ValidationResult,
  ICommandValidator
} from '../types/command-validation';

/**
 * Default command validator implementation
 */
export class CommandValidator implements ICommandValidator {
  private customRules = new Map<
    string,
    (value: any, rule: ValidationRule) => boolean | Promise<boolean>
  >();

  /**
   * Add custom validation rule
   */
  addRule(
    type: string,
    validate: (value: any, rule: ValidationRule) => boolean | Promise<boolean>
  ): void {
    this.customRules.set(type, validate);
  }

  /**
   * Remove custom validation rule
   */
  removeRule(type: string): void {
    this.customRules.delete(type);
  }

  /**
   * Validate command arguments against schema
   */
  async validate(args: string[], schema: ValidationSchema): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const parsed = {
      args: [] as any[],
      options: {} as Record<string, any>
    };

    try {
      // Validate positional arguments
      if (schema.args) {
        await this.validatePositionalArgs(args, schema.args, errors, parsed);
      }

      // Validate named options
      if (schema.options) {
        await this.validateNamedOptions(args, schema.options, schema.allowUnknown, errors, parsed);
      }

      // Run custom validation if provided
      if (schema.validate) {
        const isValid = await schema.validate(args);
        if (!isValid) {
          errors.push({
            field: '*',
            message: 'Custom validation failed',
            rule: 'custom'
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        parsed: errors.length === 0 ? parsed : undefined
      };
    } catch (error) {
      errors.push({
        field: '*',
        message: error instanceof Error ? error.message : String(error),
        rule: 'system'
      });

      return { valid: false, errors };
    }
  }

  private async validatePositionalArgs(
    args: string[],
    rules: ValidationRule[],
    errors: ValidationError[],
    parsed: { args: any[] }
  ): Promise<void> {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const value = args[i];

      if (value === undefined) {
        if (rule.required) {
          errors.push({
            field: rule.name,
            message: rule.message || `${rule.name} is required`,
            rule: 'required'
          });
        }
        continue;
      }

      const parsedValue = await this.validateValue(value, rule);
      if (parsedValue.error) {
        errors.push(parsedValue.error);
      } else {
        parsed.args[i] = parsedValue.value;
      }
    }
  }

  private async validateNamedOptions(
    args: string[],
    rules: Record<string, ValidationRule>,
    allowUnknown: boolean | undefined,
    errors: ValidationError[],
    parsed: { options: Record<string, any> }
  ): Promise<void> {
    const options = this.parseOptions(args);

    // Check for unknown options
    if (!allowUnknown) {
      const unknown = Object.keys(options).filter(key => !(key in rules));
      if (unknown.length > 0) {
        errors.push({
          field: unknown.join(', '),
          message: 'Unknown option(s)',
          rule: 'unknown'
        });
      }
    }

    // Check for required options first
    for (const [name, rule] of Object.entries(rules)) {
      if (rule.required && !(name in options)) {
        errors.push({
          field: name,
          message: rule.message || `Option ${name} is required`,
          rule: 'required'
        });
      }
    }

    // Validate provided options
    for (const [name, value] of Object.entries(options)) {
      const rule = rules[name];
      if (!rule) continue;

      const parsedValue = await this.validateValue(value, rule);
      if (parsedValue.error) {
        errors.push(parsedValue.error);
      } else {
        parsed.options[name] = parsedValue.value;
      }
    }
  }

  private async validateValue(
    value: any,
    rule: ValidationRule
  ): Promise<{ value?: any; error?: ValidationError }> {
    try {
      // Parse value based on type
      const parsed = this.parseValue(value, rule.type);

      // Check enum
      if (rule.enum && !rule.enum.includes(parsed)) {
        return {
          error: {
            field: rule.name,
            message: rule.message || `${rule.name} must be one of: ${rule.enum.join(', ')}`,
            rule: 'enum',
            value
          }
        };
      }

      // Check min/max for numbers
      if (rule.type === 'number') {
        if (rule.min !== undefined && parsed < rule.min) {
          return {
            error: {
              field: rule.name,
              message: rule.message || `${rule.name} must be >= ${rule.min}`,
              rule: 'min',
              value
            }
          };
        }
        if (rule.max !== undefined && parsed > rule.max) {
          return {
            error: {
              field: rule.name,
              message: rule.message || `${rule.name} must be <= ${rule.max}`,
              rule: 'max',
              value
            }
          };
        }
      }

      // Check min/max length for strings and arrays
      if ((rule.type === 'string' || rule.type === 'array') && typeof parsed === 'string') {
        if (rule.min !== undefined && parsed.length < rule.min) {
          return {
            error: {
              field: rule.name,
              message: rule.message || `${rule.name} must be at least ${rule.min} characters`,
              rule: 'minLength',
              value
            }
          };
        }
        if (rule.max !== undefined && parsed.length > rule.max) {
          return {
            error: {
              field: rule.name,
              message: rule.message || `${rule.name} must be at most ${rule.max} characters`,
              rule: 'maxLength',
              value
            }
          };
        }
      }

      // Check pattern for strings
      if (rule.type === 'string' && rule.pattern) {
        const regex = new RegExp(rule.pattern);
        if (!regex.test(parsed)) {
          return {
            error: {
              field: rule.name,
              message: rule.message || `${rule.name} must match pattern: ${rule.pattern}`,
              rule: 'pattern',
              value
            }
          };
        }
      }

      // Run custom validation
      if (rule.validate) {
        const isValid = await rule.validate(parsed);
        if (!isValid) {
          return {
            error: {
              field: rule.name,
              message: rule.message || `${rule.name} failed custom validation`,
              rule: 'custom',
              value
            }
          };
        }
      }

      // Run type-specific custom rule if exists
      const customRule = this.customRules.get(rule.type);
      if (customRule) {
        const isValid = await customRule(parsed, rule);
        if (!isValid) {
          return {
            error: {
              field: rule.name,
              message: rule.message || `${rule.name} failed ${rule.type} validation`,
              rule: rule.type,
              value
            }
          };
        }
      }

      return { value: parsed };
    } catch (error) {
      return {
        error: {
          field: rule.name,
          message: error instanceof Error ? error.message : String(error),
          rule: 'parse',
          value
        }
      };
    }
  }

  private parseValue(value: string, type: string): any {
    switch (type) {
      case 'string':
        return value;
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error('Invalid number');
        }
        return num;
      case 'boolean':
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        throw new Error('Invalid boolean');
      case 'array':
        return value.split(',').map(v => v.trim());
      default:
        return value;
    }
  }

  private parseOptions(args: string[]): Record<string, string> {
    const options: Record<string, string> = {};
    let i = 0;

    while (i < args.length) {
      const arg = args[i];

      // Check if argument is an option
      if (arg.startsWith('--')) {
        const name = arg.slice(2);
        
        // Check if next argument is a value
        if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          options[name] = args[i + 1];
          i += 2;
        } else {
          options[name] = 'true';
          i += 1;
        }
      } else {
        i += 1;
      }
    }

    return options;
  }
}
