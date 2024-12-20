import { Command } from './command-registry';
import { BaseCommandResult } from './command-results';

/**
 * Represents a command with strongly typed arguments and result
 */
export interface TypedCommand<TArgs, TResult extends BaseCommandResult> extends Command {
  /**
   * Execute the command with typed arguments
   */
  executeTyped(args: TArgs): Promise<TResult>;

  /**
   * Validate the typed arguments
   */
  validateArgs(args: TArgs): boolean;

  /**
   * Convert string arguments to typed arguments
   */
  parseArgs(args: string[]): TArgs;
}

/**
 * Base class for implementing typed commands
 */
export abstract class BaseTypedCommand<TArgs, TResult extends BaseCommandResult> implements TypedCommand<TArgs, TResult> {
  constructor(
    public readonly id: string,
    public readonly description: string,
    public readonly argument?: {
      name: string;
      description: string;
      schema: unknown; // JSON Schema for the arguments
    }
  ) {}

  /**
   * Default implementation that parses and validates args
   */
  async execute(args: string[]): Promise<TResult> {
    const typedArgs = this.parseArgs(args);
    if (!this.validateArgs(typedArgs)) {
      throw new Error(`Invalid arguments for command ${this.id}`);
    }
    return this.executeTyped(typedArgs);
  }

  abstract executeTyped(args: TArgs): Promise<TResult>;
  abstract validateArgs(args: TArgs): boolean;
  abstract parseArgs(args: string[]): TArgs;

  getName(): string {
    return this.id.split('.').pop() || this.id;
  }
}

/**
 * Helper type for commands that return JSON results
 */
export type JsonTypedCommand<TArgs, TJsonResult> = TypedCommand<TArgs, JsonCommandResult<TJsonResult>>;

/**
 * Helper type for commands that return text results
 */
export type TextTypedCommand<TArgs> = TypedCommand<TArgs, TextCommandResult>;

/**
 * Helper type for commands that return image results
 */
export type ImageTypedCommand<TArgs> = TypedCommand<TArgs, ImageCommandResult>;

// Re-export necessary types
import { JsonCommandResult, TextCommandResult, ImageCommandResult } from './command-results';
