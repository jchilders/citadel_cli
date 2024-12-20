import { Command } from '../types/command-registry';
import { BaseCommandResult } from '../types/command-results';
import {
  CommandContext,
  CommandExecutionResult,
  CommandMiddleware
} from '../types/command-middleware';

/**
 * Manages the middleware pipeline for command execution
 */
export class MiddlewarePipeline {
  private middleware: CommandMiddleware[] = [];

  /**
   * Add middleware to the pipeline
   */
  use(middleware: CommandMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Execute a command through the middleware pipeline
   */
  async execute(
    command: Command,
    args: string[],
    user?: { id: string; permissions: string[] }
  ): Promise<CommandExecutionResult> {
    const context: CommandContext = {
      command,
      args,
      startTime: new Date(),
      metadata: {},
      user
    };

    try {
      // Run pre-execution middleware
      for (const m of this.middleware) {
        if (m.pre) {
          await m.pre(context);
        }
      }

      // Execute command
      const result = await command.execute(args);
      const duration = Date.now() - context.startTime.getTime();

      const executionResult: CommandExecutionResult = {
        result,
        context,
        duration
      };

      // Run post-execution middleware in reverse order
      for (let i = this.middleware.length - 1; i >= 0; i--) {
        const m = this.middleware[i];
        if (m.post) {
          await m.post(executionResult);
        }
      }

      return executionResult;
    } catch (error) {
      // Run error middleware
      for (const m of this.middleware) {
        if (m.error) {
          try {
            await m.error(error as Error, context);
          } catch (e) {
            console.error('Error in error middleware:', e);
          }
        }
      }

      throw error;
    }
  }

  /**
   * Clear all middleware
   */
  clear(): void {
    this.middleware = [];
  }
}
