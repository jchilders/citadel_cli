import { CommandSegment } from "./command-registry";

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
 * Represents a command entry to be stored in history
 */
export interface StoredCommand {
  commandSegments: CommandSegment[];
  timestamp: number;
}

/**
 * Interface for command history storage implementations
 */
export interface CommandStorage {
  /**
   * Add a command to storage
   */
  addStoredCommand: (command: StoredCommand) => Promise<void>;

  /**
   * Get all stored commands
   */
  getStoredCommands: () => Promise<StoredCommand[] | []>;

  /**
   * Clear all stored commands
   */
  clear: () => Promise<void>;
}
