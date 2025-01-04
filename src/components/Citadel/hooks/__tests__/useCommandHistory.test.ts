import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommandHistory } from '../useCommandHistory';
import { StorageFactory } from '../../storage/StorageFactory';
import { StoredCommand, CommandStorage } from '../../types/storage';
import { CommandNode } from '../../types/command-trie';
import { createMockNode } from '../../../../__test-utils__/factories';
import { TextCommandResult } from '../../types/command-results';

// Mock CitadelConfigContext
vi.mock('../../config/CitadelConfigContext', () => ({
  useCitadelConfig: () => ({
    storage: { type: 'memory', maxCommands: 100 }
  })
}));

describe('useCommandHistory', () => {
  let mockNode: CommandNode;
  let mockCommand: StoredCommand;

  beforeEach(() => {
    // Create mock node using factory
    mockNode = createMockNode('test', {
      description: 'Test command',
      isLeaf: true,
      handler: async () => {
        const result = new TextCommandResult('test');
        result.markSuccess();
        return result;
      }
    });

    // Set the correct path for the node
    (mockNode as any)._fullPath = ['test', 'command'];

    mockCommand = {
      node: mockNode,
      args: ['arg1'],
      timestamp: 1
    };
  });

  // Mock storage implementing CommandStorage interface
  const mockStorage = {
    addCommand: vi.fn().mockResolvedValue(undefined),
    getCommands: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined)
  } as unknown as CommandStorage;

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
      newInput: 'test command arg1',
      position: 0
    });
    expect(result.current[0].savedInput).toBe(currentInput);
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
      newInput: 'current input',
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

    const { result } = renderHook(() => useCommandHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load command history:',
      expect.any(Error)
    );
    expect(result.current[0].commands).toEqual([]);
  });
});
