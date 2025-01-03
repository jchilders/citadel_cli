import { StorageConfig, StoredCommand } from '../types/storage';
import { BaseStorage } from './BaseStorage';

/**
 * localStorage-based command history storage
 */
export class LocalStorage extends BaseStorage {
  private readonly storageKey = 'citadel_command_history';

  constructor(config?: StorageConfig) {
    super(config);
  }

  async getCommands(): Promise<StoredCommand[]> {
    try {
      const data = window.localStorage.getItem(this.storageKey);
      if (!data) return [];
      
      return JSON.parse(data) as StoredCommand[];
    } catch (error) {
      console.warn('Failed to load commands from localStorage:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      window.localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  protected async saveCommands(commands: StoredCommand[]): Promise<void> {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(commands));
    } catch (error) {
      console.warn('Failed to save commands to localStorage:', error);
      throw error; // Re-throw to trigger fallback
    }
  }
}
