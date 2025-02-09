import { StorageConfig, StoredCommand } from '../types/storage';
import { BaseStorage } from './BaseStorage';

/**
 * In-memory command history storage
 */
export class MemoryStorage extends BaseStorage {
  private storedCommands: StoredCommand[] = [];

  constructor(config?: StorageConfig) {
    super(config);
  }

  async getStoredCommands(): Promise<StoredCommand[]> {
    // Return a deep copy to prevent external mutations
    return this.storedCommands.map(cmd => ({
      commandSegments: Array.isArray(cmd.commandSegments) ? [...cmd.commandSegments] : [],
      timestamp: cmd.timestamp
    }));
  }

  async clear(): Promise<void> {
    this.storedCommands = [];
  }

  protected async saveCommands(commands: StoredCommand[]): Promise<void> {
    // Create a deep copy to prevent external mutations
    this.storedCommands = commands.map(cmd => ({
      commandSegments: Array.isArray(cmd.commandSegments) ? [...cmd.commandSegments] : [],
      timestamp: cmd.timestamp
    }));
  }
}
