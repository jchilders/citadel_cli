import { StorageConfig, StoredCommand } from '../types/storage';
import { BaseStorage } from './BaseStorage';

/**
 * In-memory command history storage
 */
export class MemoryStorage extends BaseStorage {
  private commands: StoredCommand[] = [];

  constructor(config?: StorageConfig) {
    super(config);
  }

  async getCommands(): Promise<StoredCommand[]> {
    // Return a deep copy to prevent external mutations
    return this.commands.map(cmd => ({
      path: [...cmd.path],
      args: [...cmd.args],
      timestamp: cmd.timestamp
    }));
  }

  async clear(): Promise<void> {
    this.commands = [];
  }

  protected async saveCommands(commands: StoredCommand[]): Promise<void> {
    // Create a deep copy to prevent external mutations
    this.commands = commands.map(cmd => ({
      path: [...cmd.path],
      args: [...cmd.args],
      timestamp: cmd.timestamp
    }));
  }
}
