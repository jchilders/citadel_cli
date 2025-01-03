import { CommandNode } from "./command-trie";

/**
 * Supported storage mechanisms for command history
 */
export type StorageType = 'localStorage' | 'memory';

/**
 * Configuration options for command history storage
 */
export interface StorageConfig {
  /**
   * The storage mechanism to use for command history.
   * Defaults to 'localStorage' with fallback to 'memory' if unavailable.
   */
  type?: StorageType;

  /**
   * Maximum number of commands to store in history.
   * When exceeded, oldest commands will be removed.
   * Default is 100.
   */
  maxCommands?: number;
}

/**
 * Represents a stored command entry
 */
export interface StoredCommand {
  /**
   * Reference to the command node that was executed
   */
  node: CommandNode;
  
  /**
   * The arguments provided by the user when executing the command.
   * Will be empty if the command doesn't accept arguments.
   */
  args: string[];
  
  /**
   * Timestamp when the command was executed
   */
  timestamp: number;
}

/**
 * Interface for command history storage implementations
 */
export interface CommandStorage {
  /**
   * Add a command to storage
   */
  addCommand: (command: StoredCommand) => Promise<void>;

  /**
   * Get all stored commands
   */
  getCommands: () => Promise<StoredCommand[]>;

  /**
   * Clear all stored commands
   */
  clear: () => Promise<void>;
}
