import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommandStorage, StoredCommand } from '../../types/storage';
import { WordSegment } from '../../types/command-registry';

const createMockStorage = () => ({
  getStoredCommands: vi.fn<CommandStorage['getStoredCommands']>().mockResolvedValue([]),
  addStoredCommand: vi.fn<CommandStorage['addStoredCommand']>().mockResolvedValue(undefined),
  clear: vi.fn<CommandStorage['clear']>().mockResolvedValue(undefined)
});

describe('HistoryService', () => {
  const sampleCommand: StoredCommand = {
    commandSegments: [new WordSegment('sample')],
    timestamp: 1700000000000
  };

  beforeEach(() => {
    vi.resetModules();
  });

  it('DefaultHistoryService proxies storage operations', async () => {
    const storage = createMockStorage();
    const { DefaultHistoryService } = await import('../HistoryService');

    const service = new DefaultHistoryService(storage);
    await service.getCommands();
    expect(storage.getStoredCommands).toHaveBeenCalledTimes(1);

    await service.addCommand(sampleCommand);
    expect(storage.addStoredCommand).toHaveBeenCalledWith(sampleCommand);

    await service.clear();
    expect(storage.clear).toHaveBeenCalledTimes(1);
  });

  it('getHistoryService throws when not initialized', async () => {
    const { getHistoryService } = await import('../HistoryService');
    expect(() => getHistoryService()).toThrowError('HistoryService not initialized');
  });

  it('getHistoryService lazily initializes when storage is provided', async () => {
    const storage = createMockStorage();
    const { getHistoryService } = await import('../HistoryService');

    const service = getHistoryService(storage);
    await service.addCommand(sampleCommand);

    expect(storage.addStoredCommand).toHaveBeenCalledWith(sampleCommand);
  });

  it('initializeHistoryService overrides previous instance', async () => {
    const storageA = createMockStorage();
    const storageB = createMockStorage();
    const { getHistoryService, initializeHistoryService } = await import('../HistoryService');

    const firstService = getHistoryService(storageA);
    await firstService.addCommand(sampleCommand);
    expect(storageA.addStoredCommand).toHaveBeenCalledWith(sampleCommand);

    storageA.addStoredCommand.mockClear();

    initializeHistoryService(storageB);
    const secondService = getHistoryService();

    await secondService.addCommand(sampleCommand);
    expect(storageA.addStoredCommand).not.toHaveBeenCalled();
    expect(storageB.addStoredCommand).toHaveBeenCalledWith(sampleCommand);
  });
});
