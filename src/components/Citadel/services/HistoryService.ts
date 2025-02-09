import { CommandStorage, StoredCommand } from '../types/storage';

export interface HistoryService {
  getCommands(): Promise<StoredCommand[]>;
  addCommand(command: StoredCommand): Promise<void>;
  clear(): Promise<void>;
}

export class DefaultHistoryService implements HistoryService {
  constructor(private readonly storage: CommandStorage) {}

  async getCommands(): Promise<StoredCommand[]> {
    return this.storage.getStoredCommands();
  }

  async addCommand(command: StoredCommand): Promise<void> {
    return this.storage.addStoredCommand(command);
  }

  async clear(): Promise<void> {
    return this.storage.clear();
  }
}

// Singleton instance for easy access
let historyServiceInstance: HistoryService | null = null;

export function getHistoryService(storage?: CommandStorage): HistoryService {
  if (!historyServiceInstance && storage) {
    historyServiceInstance = new DefaultHistoryService(storage);
  }
  if (!historyServiceInstance) {
    throw new Error('HistoryService not initialized');
  }
  return historyServiceInstance;
}

export function initializeHistoryService(storage: CommandStorage): void {
  historyServiceInstance = new DefaultHistoryService(storage);
}
