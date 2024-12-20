/**
 * Error thrown when command validation fails
 */
export class CommandValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommandValidationError';
  }
}

/**
 * Validates a command ID according to the rules:
 * 1. Must use dot notation
 * 2. Must contain only alphanumeric characters and dots
 * 3. Must have at least one dot separator
 * 4. Each segment must be at least one character long
 * 
 * @throws CommandValidationError if validation fails
 */
export function validateCommandId(id: string): void {
  // Check for empty or non-string input
  if (!id || typeof id !== 'string') {
    throw new CommandValidationError('Command ID must be a non-empty string');
  }

  // Check for dot notation
  if (!id.includes('.')) {
    throw new CommandValidationError('Command ID must use dot notation (e.g., "category.command")');
  }

  // Check for valid characters
  if (!/^[a-zA-Z0-9.]+$/.test(id)) {
    throw new CommandValidationError('Command ID must contain only alphanumeric characters and dots');
  }

  // Check segments
  const segments = id.split('.');
  const invalidSegments = segments.filter(s => s.length === 0);
  if (invalidSegments.length > 0) {
    throw new CommandValidationError('Command ID segments must be at least one character long');
  }

  // Check for consecutive dots
  if (id.includes('..')) {
    throw new CommandValidationError('Command ID cannot contain consecutive dots');
  }

  // Check for starting/ending dots
  if (id.startsWith('.') || id.endsWith('.')) {
    throw new CommandValidationError('Command ID cannot start or end with a dot');
  }
}

/**
 * Validates command arguments
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
 * Utility to create a valid command ID
 * Replaces invalid characters with underscores and ensures proper dot notation
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
  return sanitized.includes('.') ? sanitized : `command.${sanitized}`;
}
