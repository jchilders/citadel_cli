import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommandHistory } from '../useCommandHistory';
import { StorageFactory } from '../../storage/StorageFactory';
import { StoredCommand, CommandStorage } from '../../types/storage';
import { createMockNode } from '../../../../__test-utils__/factories';
import { CommandNode } from '../../types/command-trie';

// Mock storage implementing CommandStorage interface
const mockStorage = {
  addCommand: vi.fn().mockResolvedValue(undefined),
  getCommands: vi.fn().mockResolvedValue([]),
  clear: vi.fn().mockResolvedValue(undefined)
} as unknown as CommandStorage;

vi.mock('../../config/CitadelConfigContext', () => ({
  useCitadelConfig: () => ({
    storage: { type: 'memory', maxCommands: 100 }
  }),
  useCitadelStorage: () => mockStorage
}));

describe('useCommandHistory', () => {
  let mockNode: CommandNode;
  let mockCommand: StoredCommand;

  beforeEach(() => {
    mockNode = createMockNode('test');

    // Set the correct path for the node
    (mockNode as any)._fullPath = ['test', 'command'];

    mockCommand = {
      inputs: ['test', 'arg1'],
      timestamp: 1
    };
  });

  beforeEach(() => {
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
      commands: [],
      position: null,
      savedInput: null
    });
  });

  it('should add command to history', async () => {
    const { result } = renderHook(() => useCommandHistory());
    await act(async () => {
      await result.current[1].addCommand(mockCommand);
    });
    expect(mockStorage.addCommand).toHaveBeenCalledTimes(1);
    expect(mockStorage.addCommand).toHaveBeenCalledWith(mockCommand);
    expect(result.current[0].commands).toEqual([mockCommand]);
  });

  it('should navigate history upward', async () => {
    (mockStorage.getCommands as unknown as Mock<() => Promise<StoredCommand[]>>).mockResolvedValue([mockCommand]);

    const { result } = renderHook(() => useCommandHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const currentInput = 'current input';
    let navigation;

    act(() => {
      navigation = result.current[1].navigateHistory('up', currentInput);
    });

    expect(navigation).toEqual({
      command: mockCommand,
      position: 0
    });
    const savedInput = result.current[0].savedInput;
    expect(savedInput).not.toBeNull();
    expect(savedInput).toEqual({
      inputs: ['current', 'input'],
      timestamp: expect.any(Number)
    });
  });

  it('should navigate history downward', async () => {
    (mockStorage.getCommands as unknown as Mock<() => Promise<StoredCommand[]>>).mockResolvedValue([mockCommand]);

    const { result } = renderHook(() => useCommandHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // First go up
    act(() => {
      result.current[1].navigateHistory('up', 'current input');
    });

    // Then go down
    let navigation;
    act(() => {
      navigation = result.current[1].navigateHistory('down', '');
    });

    expect(navigation).toEqual({
      command: { inputs: ['current', 'input'], timestamp: expect.any(Number) },
      position: null
    });
    expect(result.current[0].savedInput).toBeNull();
  });

  it('should clear history', async () => {
    (mockStorage.getCommands as unknown as Mock<() => Promise<StoredCommand[]>>).mockResolvedValue([mockCommand]);

    const { result } = renderHook(() => useCommandHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current[1].clear();
    });

    expect(mockStorage.clear).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toEqual({
      commands: [],
      position: null,
      savedInput: null
    });
  });

  it('should handle storage errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    (mockStorage.getCommands as unknown as Mock<() => Promise<StoredCommand[]>>).mockRejectedValue(new Error('Storage error'));

    renderHook(() => useCommandHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load command history:', expect.any(Error));
  });
});
