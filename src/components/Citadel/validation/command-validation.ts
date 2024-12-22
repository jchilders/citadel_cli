/**
 * Command validation error
 */
export class CommandValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommandValidationError';
  }
}

/**
 * Validation rule for command arguments
 */
export interface ValidationRule {
  /** Name of the argument */
  name: string;
  /** Type of the argument */
  type: 'string' | 'number' | 'boolean' | 'array';
  /** Whether the argument is required */
  required?: boolean;
  /** Array of allowed values */
  enum?: any[];
  /** Minimum value (for numbers) or length (for strings/arrays) */
  min?: number;
  /** Maximum value (for numbers) or length (for strings/arrays) */
  max?: number;
  /** Regular expression pattern (for strings) */
  pattern?: string;
  /** Custom validation function */
  validate?: (value: any) => boolean | Promise<boolean>;
  /** Custom error message */
  message?: string;
}

/**
 * Validation schema for command
 */
export interface ValidationSchema {
  /** Rules for positional arguments */
  args?: ValidationRule[];
  /** Rules for named options */
  options?: Record<string, ValidationRule>;
  /** Whether to allow unknown options */
  allowUnknown?: boolean;
  /** Custom validation function for entire command */
  validate?: (args: string[]) => boolean | Promise<boolean>;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Name of the argument */
  field: string;
  /** Error message */
  message: string;
  /** Validation rule that failed */
  rule: string;
  /** Value that failed validation */
  value?: any;
}

/**
 * Result of validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
  /** Parsed and validated values */
  parsed?: {
    args: any[];
    options: Record<string, any>;
  };
}

/**
 * Validates a command ID
 * @throws CommandValidationError if validation fails
 */
export function validateCommandId(id: string): void {
  if (!id) {
    throw new CommandValidationError('Command ID is required');
  }

  // Check for valid characters in entire ID
  if (!/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(id)) {
    throw new CommandValidationError('Command ID must start with a letter and contain only letters, numbers, dots, and underscores');
  }

  // If using dot notation, validate each segment
  if (id.includes('.')) {
    const segments = id.split('.');
    if (segments.some(segment => !segment)) {
      throw new CommandValidationError('Command ID segments cannot be empty');
    }
    if (segments.some(segment => !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(segment))) {
      throw new CommandValidationError('Command ID segments must start with a letter and contain only letters, numbers, and underscores');
    }
  }
}

/**
 * Validates command description
 * @throws CommandValidationError if validation fails
 */
export function validateCommandDescription(description: string): void {
  if (!description) {
    throw new CommandValidationError('Command description is required');
  }
}

/**
 * Validates command argument
 * @throws CommandValidationError if validation fails
 */
export function validateCommandArgument(argument: any): void {
  if (argument) {
    if (typeof argument !== 'object') {
      throw new CommandValidationError('Command argument must be an object');
    }

    if (!argument.name || typeof argument.name !== 'string') {
      throw new CommandValidationError('Command argument must have a name property of type string');
    }

    if (!argument.description || typeof argument.description !== 'string') {
      throw new CommandValidationError('Command argument must have a description property of type string');
    }
  }
}

/**
 * Validates command handler
 * @throws CommandValidationError if validation fails
 */
export function validateCommandHandler(handler: any): void {
  if (typeof handler !== 'function') {
    throw new CommandValidationError('Command handler must be a function');
  }
}

/**
 * Validates command arguments against schema
 * @throws CommandValidationError if validation fails
 */
export function validateCommandArguments(
  args: string[],
  expectedCount?: number
): void {
  if (!Array.isArray(args)) {
    throw new CommandValidationError('Arguments must be an array');
  }

  if (expectedCount !== undefined && args.length !== expectedCount) {
    throw new CommandValidationError(
      `Expected ${expectedCount} arguments, but got ${args.length}`
    );
  }
}

/**
 * Sanitizes a command ID by replacing invalid characters and ensuring proper dot notation
 */
export function sanitizeCommandId(id: string): string {
  const sanitized = id
    // Replace invalid characters with underscores
    .replace(/[^a-zA-Z0-9.]/g, '_')
    // Replace multiple consecutive dots with a single dot
    .replace(/\.+/g, '.')
    // Remove leading/trailing dots
    .replace(/^\.+|\.+$/g, '');

  // Only add command prefix if there's no dot notation
  return sanitized.includes('.') ? sanitized : sanitized;
}
