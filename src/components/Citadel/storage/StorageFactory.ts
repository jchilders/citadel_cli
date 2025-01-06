import { CommandStorage, StorageConfig } from "../types/storage";
import { LocalStorage } from "./LocalStorage";
import { MemoryStorage } from "./MemoryStorage";

export class StorageFactory {
  private static instance: StorageFactory;
  private currentStorage?: CommandStorage;

  private constructor() {}

  static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
  }

  initializeStorage(config: StorageConfig): void {
    if (!this.currentStorage) {
      try {
        this.currentStorage = new LocalStorage(config);
      } catch (error) {
        console.warn('Failed to create storage, falling back to memory storage:', error);
        this.currentStorage = new MemoryStorage(config);
      }
    }
  }

  getStorage(): CommandStorage {
    if (!this.currentStorage) {
      throw new Error('Storage not initialized. Call initializeStorage first.');
    }
    return this.currentStorage;
  }
}