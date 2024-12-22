import {
  CommandError,
  CommandErrorCode,
  IErrorHandler
} from '../types/command-errors';

/**
 * Default error handler implementation
 */
export class CommandErrorHandler implements IErrorHandler {
  private readonly errorHandlers = new Map<string, (error: CommandError) => void>();
  private readonly errorLog: CommandError[] = [];
  private readonly maxLogSize = 100;

  constructor() {
    // Register default handlers
    this.registerHandler(CommandErrorCode.NotFound, this.handleNotFound.bind(this));
    this.registerHandler(CommandErrorCode.InvalidArguments, this.handleInvalidArgs.bind(this));
    this.registerHandler(CommandErrorCode.PermissionDenied, this.handlePermissionDenied.bind(this));
    this.registerHandler(CommandErrorCode.RateLimitExceeded, this.handleRateLimit.bind(this));
    this.registerHandler(CommandErrorCode.ExecutionFailed, this.handleExecution.bind(this));
    this.registerHandler(CommandErrorCode.Cancelled, this.handleCancelled.bind(this));
    this.registerHandler(CommandErrorCode.Timeout, this.handleTimeout.bind(this));
    this.registerHandler(CommandErrorCode.InvalidState, this.handleInvalidState.bind(this));
    this.registerHandler(CommandErrorCode.SystemError, this.handleSystem.bind(this));
  }

  /**
   * Register custom error handler
   */
  registerHandler(code: string, handler: (error: CommandError) => void): void {
    this.errorHandlers.set(code, handler);
  }

  /**
   * Handle command error
   */
  handleError(error: CommandError): void {
    // Log error
    this.logError(error);

    // Get handler for error code
    const handler = this.errorHandlers.get(error.code);
    if (handler) {
      handler(error);
    } else {
      // Default handler
      console.error('Unhandled command error:', error);
    }
  }

  /**
   * Get error details
   */
  getErrorDetails(error: CommandError): Record<string, any> {
    return {
      code: error.code,
      message: error.message,
      details: error.details || {},
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Format error for display
   */
  formatError(error: CommandError): string {
    const details = this.getErrorDetails(error);
    return `Error [${details.code}]: ${details.message}
Details: ${JSON.stringify(details.details, null, 2)}
Time: ${details.timestamp}`;
  }

  /**
   * Get error log
   */
  getErrorLog(): CommandError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog.length = 0;
  }

  private logError(error: CommandError): void {
    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.pop();
    }
  }

  // Default handlers for each error type
  private handleNotFound(error: CommandError): void {
    console.error('Command not found:', error.details?.commandId);
  }

  private handleInvalidArgs(error: CommandError): void {
    console.error('Invalid arguments:', error.message);
    if (error.details?.validation) {
      console.error('Validation errors:');
      error.details.validation.forEach((v: any) => {
        console.error(`- ${v.field}: ${v.error}`);
      });
    }
  }

  private handlePermissionDenied(error: CommandError): void {
    console.error('Permission denied:', error.message);
    console.error('Required permissions:', error.details?.requiredPermissions);
  }

  private handleRateLimit(error: CommandError): void {
    console.error('Rate limit exceeded:', error.message);
    console.error(
      `Limit: ${error.details?.limit} requests per ${error.details?.window}ms`
    );
  }

  private handleExecution(error: CommandError): void {
    console.error('Execution failed:', error.message);
    if (error.details?.cause) {
      console.error('Cause:', error.details.cause);
    }
  }

  private handleCancelled(error: CommandError): void {
    console.warn('Command cancelled:', error.details?.commandId);
  }

  private handleTimeout(error: CommandError): void {
    console.error(
      'Command timed out:',
      error.details?.commandId,
      `after ${error.details?.timeout}ms`
    );
  }

  private handleInvalidState(error: CommandError): void {
    console.error('Invalid state:', error.message);
    console.error(
      `Expected: ${error.details?.expectedState}, ` +
      `Actual: ${error.details?.actualState}`
    );
  }

  private handleSystem(error: CommandError): void {
    console.error('System error:', error.message);
    console.error('Details:', error.details);
  }
}
