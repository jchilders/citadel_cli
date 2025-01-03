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
    return [...this.commands];
  }

  async clear(): Promise<void> {
    this.commands = [];
  }

  protected async saveCommands(commands: StoredCommand[]): Promise<void> {
    this.commands = [...commands];
  }
}
