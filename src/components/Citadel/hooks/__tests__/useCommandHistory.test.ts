import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommandHistory } from '../useCommandHistory';
import { 
  createMockStoredCommand,
  createMockStorage 
} from '../../../../__test-utils__/factories';

const mockStorage = createMockStorage();

// Mock hooks
vi.mock('../../config/hooks', () => ({
  useCitadelStorage: () => mockStorage
}));

describe('useCommandHistory', () => {
  const mockStoredCommand = createMockStoredCommand();
  const mockSegments = mockStoredCommand.commandSegments;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupHistory = async () => {
    const hook = renderHook(() => useCommandHistory());
    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    return hook;
  };

  it('should initialize with empty history', async () => {
    const { result } = await setupHistory();
    expect(result.current.history).toEqual({
      storedCommands: [],
      position: null,
    });
  });

  it('should add command to history', async () => {
    const { result } = await setupHistory();
    
    await act(async () => {
      await result.current.addStoredCommand(mockSegments);
    });

    expect(mockStorage.addStoredCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        commandSegments: mockSegments,
        timestamp: expect.any(Number)
      })
    );
  });

  describe('history navigation', () => {
    beforeEach(() => {
      mockStorage.getStoredCommands.mockResolvedValue([mockStoredCommand]);
    });

    it('should navigate up to previous command', async () => {
      const { result } = await setupHistory();
      
      const navigation = await act(async () => {
        return await result.current.navigateHistory('up', mockSegments);
      });

      expect(navigation).toEqual({
        segments: mockStoredCommand.commandSegments,
        position: 0
      });
    });

    it('should navigate down to clear input', async () => {
      const { result } = await setupHistory();
      
      // First navigate up
      await act(async () => {
        await result.current.navigateHistory('up', mockSegments);
      });

      // Then navigate down
      const navigation = await act(async () => {
        return await result.current.navigateHistory('down', mockSegments);
      });

      expect(navigation).toEqual({
        segments: [],
        position: null
      });
    });

    it('should stay at start of history when navigating up at beginning', async () => {
      const { result } = await setupHistory();
      
      // Navigate up twice
      await act(async () => {
        await result.current.navigateHistory('up', mockSegments);
      });
      
      const navigation = await act(async () => {
        return await result.current.navigateHistory('up', mockSegments);
      });

      expect(navigation).toEqual({
        segments: mockStoredCommand.commandSegments,
        position: 0
      });
    });
  });

  it('should clear history', async () => {
    mockStorage.getStoredCommands.mockResolvedValue([mockStoredCommand]);
    const { result } = await setupHistory();

    await act(async () => {
      await result.current.clear();
    });

    expect(mockStorage.clear).toHaveBeenCalled();
    expect(result.current.history).toEqual({
      storedCommands: [],
      position: null
    });
  });

  it('should handle storage errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    mockStorage.getStoredCommands.mockRejectedValue(new Error('Storage error'));

    await setupHistory();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load command history:',
      expect.any(Error)
    );
  });
});
