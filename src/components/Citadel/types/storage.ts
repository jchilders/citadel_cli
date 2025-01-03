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
   * The command and its arguments as an array of strings
   */
  command: string[];
  
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
   * Add a command to history
   */
  addCommand(command: StoredCommand): Promise<void>;
  
  /**
   * Get all stored commands, ordered by timestamp ascending
   */
  getCommands(): Promise<StoredCommand[]>;
  
  /**
   * Clear all stored commands
   */
  clear(): Promise<void>;
}
