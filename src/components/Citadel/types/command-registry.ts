import { BaseCommandResult } from './command-results';
import { CommandArgument } from './command-trie';

/**
 * Base command interface representing a command in the system
 */
export interface Command {
  /** 
   * Unique identifier for the command using dot notation (e.g., 'system.echo')
   * The last segment of the path is used as the display name
   */
  id: string;
  
  /** Detailed description of what the command does */
  description: string;

  /** Optional argument definition */
  argument?: CommandArgument;
  
  /** Function to execute the command with given arguments */
  execute(args: string[]): Promise<BaseCommandResult>;

  /** 
   * Gets the display name of the command (last segment of id)
   * @example
   * ```typescript
   * const cmd = { id: 'system.echo', ... };
   * cmd.getName(); // returns 'echo'
   * ```
   */
  getName(): string;
}

/** Utility function to get command name from id */
export const getCommandName = (id: string): string => {
  return id.split('.').pop() || id;
};

/**
 * Abstract base class providing common command functionality
 */
export abstract class BaseCommand implements Command {
  constructor(
    public readonly id: string,
    public readonly description: string,
    public readonly argument?: CommandArgument,
  ) {}

  abstract execute(args: string[]): Promise<BaseCommandResult>;

  getName(): string {
    return getCommandName(this.id);
  }
}

/**
 * Metadata associated with a command registration
 */
export interface CommandMetadata {
  /** List of permissions required to execute the command */
  permissions?: string[];
  
  /** Maximum time (ms) allowed for command execution */
  timeout?: number;
  
  /** Rate limiting configuration */
  rateLimits?: {
    /** Maximum number of requests allowed */
    maxRequests: number;
    /** Time window (ms) for rate limiting */
    timeWindow: number;
  };
}

/**
 * Registry interface for managing commands
 */
export interface ICommandRegistry {
  // Core operations
  /**
   * Register a new command with optional metadata
   * @throws Error if command with same id already exists
   */
  register(command: Command, metadata?: CommandMetadata): void;
  
  /**
   * Unregister a command by its id
   */
  unregister(commandId: string): void;
  
  /**
   * Get a command by its id
   * @returns Command if found, undefined otherwise
   */
  get(commandId: string): Command | undefined;
  
  /**
   * List all registered commands
   */
  list(): Command[];
  
  // Query operations
  /**
   * Find commands by display name
   * @returns Array of commands matching the name
   */
  findByName(name: string): Command[];
  
  /**
   * Find commands by required permission
   * @returns Array of commands requiring the permission
   */
  findByPermission(permission: string): Command[];
  
  // Metadata operations
  /**
   * Get metadata for a command
   * @returns CommandMetadata if found, undefined otherwise
   */
  getMetadata(commandId: string): CommandMetadata | undefined;
  
  /**
   * Update metadata for a command
   * @throws Error if command not found
   */
  updateMetadata(commandId: string, metadata: Partial<CommandMetadata>): void;

  // Trie-specific operations
  /**
   * Gets command completions for a given path
   * @returns Array of completion strings
   */
  getCompletions(path: string[]): string[];

  /**
   * Validates the command structure
   * @returns Validation result with any errors
   */
  validate(): { isValid: boolean; errors: string[] };
}
