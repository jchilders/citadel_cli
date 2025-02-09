import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommandHistory } from '../useCommandHistory';
import { StorageFactory } from '../../storage/StorageFactory';
import { StoredCommand, CommandStorage } from '../../types/storage';
import { createMockCommand, createMockCommandSegment } from '../../../../__test-utils__/factories';
import { CommandNode } from '../../types/command-trie';

// Mock storage implementing CommandStorage interface
const mockStorage = {
  addStoredCommand: vi.fn(),
  getStoredCommands: vi.fn(),
  clear: vi.fn()
};

// Setup default mock implementations
mockStorage.addStoredCommand.mockResolvedValue(undefined);
mockStorage.getStoredCommands.mockResolvedValue([]);
mockStorage.clear.mockResolvedValue(undefined);

vi.mock('../../config/CitadelConfigContext', () => ({
  useCitadelConfig: () => ({
    storage: { type: 'memory', maxCommands: 100 }
  }),
  useCitadelStorage: () => mockStorage
}));

describe('useCommandHistory', () => {
  let mockNode: CommandNode;
  let mockStoredCommand: StoredCommand;

  beforeEach(() => {
    mockNode = createMockCommand('test');
    let wordCmdSegment = createMockCommandSegment('word', 'command1');
    mockStoredCommand = {
      commandSegments: [wordCmdSegment],
      timestamp: Date.now()
    }

    vi.clearAllMocks();
    vi.spyOn(StorageFactory.getInstance(), 'getStorage').mockReturnValue(mockStorage);
  });

  it('should initialize with empty history', async () => {
    let result: any;
    await act(async () => {
      const hookResult = renderHook(() => useCommandHistory());
      result = hookResult.result;
    });
    expect(result.current[0]).toEqual({
      storedCommands: [],
      position: null,
    });
  });

  it('should add command to history', async () => {
    const { result } = renderHook(() => useCommandHistory());
    const segments = mockStoredCommand.commandSegments;
    await act(async () => {
      await result.current[1].addStoredCommand(segments);
    });
    expect(mockStorage.addStoredCommand).toHaveBeenCalledTimes(1);
    expect(mockStorage.addStoredCommand).toHaveBeenCalledWith({
      commandSegments: mockStoredCommand.commandSegments,
      timestamp: expect.any(Number)
    });
    expect(result.current[0].storedCommands).toEqual([{
      commandSegments: mockStoredCommand.commandSegments,
      timestamp: expect.any(Number)
    }]);
  });

  it('should navigate history upward', async () => {
    mockStorage.getStoredCommands.mockResolvedValue([mockStoredCommand]);

    const { result } = renderHook(() => useCommandHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const currentSegments = [createMockCommandSegment('word', 'command1')];
    let historyItem;

    await act(async () => {
      historyItem = await result.current[1].navigateHistory('up', currentSegments);
    });

    expect(historyItem).toEqual({
      segments: mockStoredCommand.commandSegments,
      position: 0
    });
  });

  it('should navigate history downward', async () => {
    mockStorage.getStoredCommands.mockResolvedValue([mockStoredCommand]);

    const { result } = renderHook(() => useCommandHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const currentSegments = [createMockCommandSegment('word', 'command1')];

    // First go up
    await act(async () => {
      await result.current[1].navigateHistory('up', currentSegments);
    });

    // Then go down
    let navigation;
    await act(async () => {
      navigation = await result.current[1].navigateHistory('down', currentSegments);
    });

    expect(navigation).toEqual({
      segments: currentSegments,
      position: null
    });
  });

  it('should clear history', async () => {
    (mockStorage.getStoredCommands as unknown as Mock<() => Promise<StoredCommand[]>>).mockResolvedValue([mockStoredCommand]);

    const { result } = renderHook(() => useCommandHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current[1].clear();
    });

    expect(mockStorage.clear).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toEqual({
      storedCommands: [],
      position: null
    });
  });

  it('should handle storage errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    mockStorage.getStoredCommands.mockRejectedValue(new Error('Storage error'));

    renderHook(() => useCommandHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load command history:', expect.any(Error));
  });
});
