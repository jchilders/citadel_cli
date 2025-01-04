import { StorageConfig, CommandStorage } from '../types/storage';
import { LocalStorage } from './LocalStorage';
import { MemoryStorage } from './MemoryStorage';
import { CommandNode } from '../types/command-trie';

/**
 * Factory for creating and managing command storage instances
 */
export class StorageFactory {
  private static instance: StorageFactory;
  private currentStorage?: CommandStorage;
  private config?: StorageConfig;
  private rootNode?: CommandNode;

  private constructor() {}

  static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
  }

  /**
   * Get or create a storage instance based on configuration
   */
  getStorage(config?: StorageConfig): CommandStorage {
    // If we already have a storage instance and config hasn't changed, return it
    if (this.currentStorage && this.config === config) {
      return this.currentStorage;
    }

    this.config = config;
    return this.createStorage(config);
  }

  /**
   * Create a new storage instance with fallback handling
   */
  private createStorage(config?: StorageConfig): CommandStorage {
    const type = config?.type || 'localStorage';
    
    if (type === 'localStorage') {
      try {
        // Test localStorage availability
        window.localStorage.setItem('citadel_test', 'test');
        window.localStorage.removeItem('citadel_test');
        
        this.currentStorage = new LocalStorage(config, this.rootNode);
        return this.currentStorage;
      } catch (error) {
        console.warn('localStorage not available, falling back to memory storage:', error);
        // Fall back to memory storage
      }
    }
    
    this.currentStorage = new MemoryStorage(config);
    return this.currentStorage;
  }
}
