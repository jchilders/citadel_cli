import { Command } from './command-registry';
import { BaseCommandResult } from './command-results';

/**
 * Context object passed through the middleware pipeline
 */
export interface CommandContext {
  command: Command;
  args: string[];
  startTime: Date;
  metadata: Record<string, any>;
  user?: {
    id: string;
    permissions: string[];
  };
}

/**
 * Result of command execution with metadata
 */
export interface CommandExecutionResult {
  result: BaseCommandResult;
  context: CommandContext;
  error?: Error;
  duration: number;
}

/**
 * Interface for command middleware
 */
export interface CommandMiddleware {
  /**
   * Called before command execution
   * Can modify context or prevent execution by throwing
   */
  pre?(context: CommandContext): Promise<void>;

  /**
   * Called after successful command execution
   * Can modify the result or perform side effects
   */
  post?(result: CommandExecutionResult): Promise<void>;

  /**
   * Called when an error occurs during execution
   * Can handle the error or rethrow
   */
  error?(error: Error, context: CommandContext): Promise<void>;
}

/**
 * Common middleware implementations
 */
export class CommonMiddleware {
  /**
   * Validates user permissions
   */
  static permissionCheck(requiredPermissions: string[]): CommandMiddleware {
    return {
      pre: async (context: CommandContext) => {
        if (!context.user) {
          throw new Error('No user context available');
        }

        const missing = requiredPermissions.filter(
          p => !context.user!.permissions.includes(p)
        );

        if (missing.length > 0) {
          throw new Error(
            `Missing required permissions: ${missing.join(', ')}`
          );
        }
      }
    };
  }

  /**
   * Implements rate limiting
   */
  static rateLimit(maxRequests: number, timeWindow: number): CommandMiddleware {
    const requests = new Map<string, number[]>();

    return {
      pre: async (context: CommandContext) => {
        if (!context.user) return;

        const now = Date.now();
        const userRequests = requests.get(context.user.id) || [];
        
        // Remove old requests outside the time window
        const recent = userRequests.filter(
          time => now - time < timeWindow
        );

        if (recent.length >= maxRequests) {
          throw new Error(
            `Rate limit exceeded. Maximum ${maxRequests} requests per ${timeWindow}ms.`
          );
        }

        recent.push(now);
        requests.set(context.user.id, recent);
      }
    };
  }

  /**
   * Adds timing information
   */
  static timing(): CommandMiddleware {
    return {
      post: async (result: CommandExecutionResult) => {
        const duration = result.duration;
        if (duration > 1000) {
          console.warn(`Command ${result.context.command.id} took ${duration}ms`);
        }
      }
    };
  }

  /**
   * Logs command execution
   */
  static logging(): CommandMiddleware {
    return {
      pre: async (context: CommandContext) => {
        console.log(
          `Executing ${context.command.id} with args:`,
          context.args
        );
      },
      post: async (result: CommandExecutionResult) => {
        console.log(
          `Completed ${result.context.command.id} in ${result.duration}ms`
        );
      },
      error: async (error: Error, context: CommandContext) => {
        console.error(
          `Error executing ${context.command.id}:`,
          error
        );
      }
    };
  }
}
