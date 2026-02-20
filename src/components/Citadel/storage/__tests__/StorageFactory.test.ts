import { beforeEach, describe, expect, it } from 'vitest';
import { StorageFactory } from '../StorageFactory';
import { LocalStorage } from '../LocalStorage';
import { MemoryStorage } from '../MemoryStorage';

describe('StorageFactory', () => {
  beforeEach(() => {
    StorageFactory.reset();
  });

  it('creates memory storage when configured', () => {
    const factory = StorageFactory.getInstance();
    factory.initializeStorage({
      type: 'memory',
      maxCommands: 25
    });

    expect(factory.getStorage()).toBeInstanceOf(MemoryStorage);
  });

  it('creates localStorage storage when configured', () => {
    const factory = StorageFactory.getInstance();
    factory.initializeStorage({
      type: 'localStorage',
      maxCommands: 25
    });

    expect(factory.getStorage()).toBeInstanceOf(LocalStorage);
  });

  it('reinitializes storage when config changes', () => {
    const factory = StorageFactory.getInstance();
    factory.initializeStorage({
      type: 'memory',
      maxCommands: 25
    });
    const firstStorage = factory.getStorage();

    factory.initializeStorage({
      type: 'localStorage',
      maxCommands: 10
    });
    const secondStorage = factory.getStorage();

    expect(secondStorage).toBeInstanceOf(LocalStorage);
    expect(secondStorage).not.toBe(firstStorage);
  });
});
