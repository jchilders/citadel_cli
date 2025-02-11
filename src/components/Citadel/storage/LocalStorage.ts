import { StorageConfig, StoredCommand } from '../types/storage';
import { BaseStorage } from './BaseStorage';

/**
 * localStorage-based command history storage
 */
export class LocalStorage extends BaseStorage {
  private readonly storageKey = 'citadel_command_history';

  constructor(config: StorageConfig) {
    super(config);
  }

  async getStoredCommands(): Promise<StoredCommand[]> {
    try {
      const data = window.localStorage.getItem(this.storageKey);
      if (!data) return [];
      const commands = JSON.parse(data) as StoredCommand[];
      return commands.map(cmd => ({
        commandSegments: cmd.commandSegments || [],
        timestamp: cmd.timestamp
      }));
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
      const serializedCommands = commands.map(cmd => ({
        commandSegments: Array.isArray(cmd.commandSegments) ? [...cmd.commandSegments] : [],
        timestamp: cmd.timestamp
      }));
      window.localStorage.setItem(this.storageKey, JSON.stringify(serializedCommands));
    } catch (error) {
      console.warn('Failed to save commands to localStorage:', error);
      throw error; // Re-throw to trigger fallback
    }
  }
}
