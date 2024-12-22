/**
 * Base class for command-related errors
 */
export class CommandError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'CommandError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details
    };
  }
}

/**
 * Error codes for command system
 */
export enum CommandErrorCode {
  // Command not found
  NotFound = 'COMMAND_NOT_FOUND',
  // Invalid arguments
  InvalidArguments = 'INVALID_ARGUMENTS',
  // Permission denied
  PermissionDenied = 'PERMISSION_DENIED',
  // Rate limit exceeded
  RateLimitExceeded = 'RATE_LIMIT_EXCEEDED',
  // Command execution failed
  ExecutionFailed = 'EXECUTION_FAILED',
  // Command cancelled
  Cancelled = 'CANCELLED',
  // Command timeout
  Timeout = 'TIMEOUT',
  // Invalid command state
  InvalidState = 'INVALID_STATE',
  // System error
  SystemError = 'SYSTEM_ERROR'
}

/**
 * Error thrown when command is not found
 */
export class CommandNotFoundError extends CommandError {
  constructor(commandId: string) {
    super(
      `Command not found: ${commandId}`,
      CommandErrorCode.NotFound,
      { commandId }
    );
    this.name = 'CommandNotFoundError';
  }
}

/**
 * Error thrown when command arguments are invalid
 */
export class InvalidArgumentsError extends CommandError {
  constructor(
    message: string,
    public readonly validation: {
      field: string;
      error: string;
    }[]
  ) {
    super(
      message,
      CommandErrorCode.InvalidArguments,
      { validation }
    );
    this.name = 'InvalidArgumentsError';
  }
}

/**
 * Error thrown when command execution is denied
 */
export class PermissionDeniedError extends CommandError {
  constructor(
    commandId: string,
    public readonly requiredPermissions: string[]
  ) {
    super(
      `Permission denied for command: ${commandId}`,
      CommandErrorCode.PermissionDenied,
      { commandId, requiredPermissions }
    );
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitExceededError extends CommandError {
  constructor(
    commandId: string,
    public readonly limit: number,
    public readonly window: number
  ) {
    super(
      `Rate limit exceeded for command: ${commandId}`,
      CommandErrorCode.RateLimitExceeded,
      { commandId, limit, window }
    );
    this.name = 'RateLimitExceededError';
  }
}

/**
 * Error thrown when command execution fails
 */
export class ExecutionError extends CommandError {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(
      message,
      CommandErrorCode.ExecutionFailed,
      cause ? { cause: cause.message } : undefined
    );
    this.name = 'ExecutionError';
  }
}

/**
 * Error thrown when command is cancelled
 */
export class CommandCancelledError extends CommandError {
  constructor(commandId: string) {
    super(
      `Command cancelled: ${commandId}`,
      CommandErrorCode.Cancelled,
      { commandId }
    );
    this.name = 'CommandCancelledError';
  }
}

/**
 * Error thrown when command times out
 */
export class CommandTimeoutError extends CommandError {
  constructor(
    commandId: string,
    public readonly timeout: number
  ) {
    super(
      `Command timed out after ${timeout}ms: ${commandId}`,
      CommandErrorCode.Timeout,
      { commandId, timeout }
    );
    this.name = 'CommandTimeoutError';
  }
}

/**
 * Error thrown when command state is invalid
 */
export class InvalidStateError extends CommandError {
  constructor(
    message: string,
    public readonly expectedState: string,
    public readonly actualState: string
  ) {
    super(
      message,
      CommandErrorCode.InvalidState,
      { expectedState, actualState }
    );
    this.name = 'InvalidStateError';
  }
}

/**
 * Interface for error handlers
 */
export interface IErrorHandler {
  /**
   * Handle command error
   */
  handleError(error: CommandError): void;

  /**
   * Get error details
   */
  getErrorDetails(error: CommandError): Record<string, any>;

  /**
   * Format error for display
   */
  formatError(error: CommandError): string;
}
