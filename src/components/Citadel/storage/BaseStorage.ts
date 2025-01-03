import { CommandStorage, StorageConfig, StoredCommand } from '../types/storage';

/**
 * Base class for command history storage implementations
 */
export abstract class BaseStorage implements CommandStorage {
  protected config: Required<StorageConfig>;

  constructor(config?: StorageConfig) {
    this.config = {
      type: 'localStorage',
      maxCommands: 100,
      ...config
    };
  }

  /**
   * Add a command to history, enforcing storage limits
   */
  async addCommand(command: StoredCommand): Promise<void> {
    const commands = await this.getCommands();
    commands.push(command);

    // Remove oldest commands if we exceed the limit
    while (commands.length > this.config.maxCommands) {
      commands.shift();
    }

    await this.saveCommands(commands);
  }

  /**
   * Get all stored commands, ordered by timestamp ascending
   */
  abstract getCommands(): Promise<StoredCommand[]>;

  /**
   * Clear all stored commands
   */
  abstract clear(): Promise<void>;

  /**
   * Save commands to storage
   * @protected
   */
  protected abstract saveCommands(commands: StoredCommand[]): Promise<void>;
}
