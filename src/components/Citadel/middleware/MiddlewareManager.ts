import {
  CommandMiddleware,
  CommandContext,
  CommandExecutionResult
} from '../types/command-middleware';
import { BaseCommandResult } from '../types/command-results';

/**
 * Manages middleware pipeline for command execution
 */
export class MiddlewareManager {
  private middleware: CommandMiddleware[] = [];

  /**
   * Add middleware to the pipeline
   */
  use(middleware: CommandMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Remove middleware from the pipeline
   */
  remove(middleware: CommandMiddleware): void {
    const index = this.middleware.indexOf(middleware);
    if (index !== -1) {
      this.middleware.splice(index, 1);
    }
  }

  /**
   * Clear all middleware
   */
  clear(): void {
    this.middleware = [];
  }

  /**
   * Execute middleware pipeline
   */
  async execute(
    context: CommandContext,
    executeCommand: () => Promise<BaseCommandResult>
  ): Promise<BaseCommandResult> {
    const startTime = Date.now();

    try {
      // Execute pre-middleware in order
      for (const m of this.middleware) {
        if (m.pre) {
          await m.pre(context);
        }
      }

      // Execute command
      const result = await executeCommand();

      // Create execution result
      const executionResult: CommandExecutionResult = {
        result,
        context,
        duration: Date.now() - startTime
      };

      // Execute post-middleware in reverse order
      for (const m of [...this.middleware].reverse()) {
        if (m.post) {
          await m.post(executionResult);
        }
      }

      return result;
    } catch (error) {
      // Execute error middleware in reverse order
      const err = error instanceof Error ? error : new Error(String(error));

      for (const m of [...this.middleware].reverse()) {
        if (m.error) {
          try {
            await m.error(err, context);
          } catch (e) {
            // Log but continue error chain
            console.error('Error in error middleware:', e);
          }
        }
      }

      throw err;
    }
  }

  /**
   * Get all middleware
   */
  getMiddleware(): CommandMiddleware[] {
    return [...this.middleware];
  }

  /**
   * Create middleware pipeline
   */
  static createPipeline(...middleware: CommandMiddleware[]): MiddlewareManager {
    const manager = new MiddlewareManager();
    middleware.forEach(m => manager.use(m));
    return manager;
  }
}
