import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCitadelState } from '../useCitadelState';
import { useCommandTrie } from '../useCommandTrie';
import { createMockCommandTrie, createMockNode } from '../../../../__test-utils__/factories';
import { JsonCommandResult } from '../../types/command-results';
import { OutputItem } from '../../types/state';
import { StorageFactory } from '../../storage/StorageFactory';

vi.mock('../useCommandTrie');

// Mock CitadelConfigContext
vi.mock('../../config/CitadelConfigContext', () => ({
  useCitadelConfig: () => ({
    storage: {
      type: 'memory',
      maxCommands: 100
    }
  }),
  useCitadelCommands: () => ({})
}));

describe('useCitadelState', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock storage to resolve immediately
    const mockStorage = {
      addCommand: vi.fn().mockResolvedValue(undefined),
      getCommands: vi.fn().mockResolvedValue([]),
      clear: vi.fn().mockResolvedValue(undefined)
    };
    vi.spyOn(StorageFactory.getInstance(), 'getStorage').mockReturnValue(mockStorage);
  });

  it('should initialize with default state', async () => {
    const mockCommandTrie = createMockCommandTrie();
    vi.mocked(useCommandTrie).mockReturnValue(mockCommandTrie);

    let result: any;
    await act(async () => {
      const hookResult = renderHook(() => useCitadelState());
      result = hookResult.result;
    });

    const expectedState = {
      commandStack: [],
      currentInput: '',
      isEnteringArg: false,
      currentNode: undefined,
      output: [],
      validation: { isValid: true },
      history: {
        commands: [],
        position: null,
        savedInput: null,
      }
    };

    expect(result.current.state).toEqual(expectedState);
  });

  it('should handle setCommandStack action', async () => {
    const mockCommandTrie = createMockCommandTrie();
    vi.mocked(useCommandTrie).mockReturnValue(mockCommandTrie);

    let result: any;
    await act(async () => {
      const hookResult = renderHook(() => useCitadelState());
      result = hookResult.result;
    });

    const commandStack = ['command1', 'command2'];
    await act(async () => {
      result.current.actions.setCommandStack(commandStack);
    });

    expect(result.current.state.commandStack).toEqual(commandStack);
  });

  it('should handle setCurrentInput action', async () => {
    const mockCommandTrie = createMockCommandTrie();
    vi.mocked(useCommandTrie).mockReturnValue(mockCommandTrie);

    let result: any;
    await act(async () => {
      const hookResult = renderHook(() => useCitadelState());
      result = hookResult.result;
    });

    const input = 'test input';
    await act(async () => {
      result.current.actions.setCurrentInput(input);
    });

    expect(result.current.state.currentInput).toBe(input);
  });

  it('should handle setCurrentNode action', async () => {
    const mockCommandTrie = createMockCommandTrie();
    vi.mocked(useCommandTrie).mockReturnValue(mockCommandTrie);

    let result: any;
    await act(async () => {
      const hookResult = renderHook(() => useCitadelState());
      result = hookResult.result;
    });

    const node = createMockNode('test');
    await act(async () => {
      result.current.actions.setCurrentNode(node);
    });

    expect(result.current.state.currentNode).toBe(node);
  });

  it('should handle addOutput action', async () => {
    const mockCommandTrie = createMockCommandTrie();
    vi.mocked(useCommandTrie).mockReturnValue(mockCommandTrie);

    let result: any;
    await act(async () => {
      const hookResult = renderHook(() => useCitadelState());
      result = hookResult.result;
    });

    const timestamp = Date.now();
    const output: OutputItem = {
      command: ['test'],
      timestamp,
      result: new JsonCommandResult({ data: 'test output' }, timestamp)
    };

    await act(async () => {
      result.current.actions.addOutput(output);
    });

    expect(result.current.state.output).toContainEqual(output);
  });

  it('should handle setValidation action', async () => {
    const mockCommandTrie = createMockCommandTrie();
    vi.mocked(useCommandTrie).mockReturnValue(mockCommandTrie);

    let result: any;
    await act(async () => {
      const hookResult = renderHook(() => useCitadelState());
      result = hookResult.result;
    });

    const validation = { isValid: false, message: 'Invalid input' };
    await act(async () => {
      result.current.actions.setValidation(validation);
    });

    expect(result.current.state.validation).toEqual(validation);
  });

  it('should handle multiple actions in sequence', async () => {
    const mockCommandTrie = createMockCommandTrie();
    vi.mocked(useCommandTrie).mockReturnValue(mockCommandTrie);

    let result: any;
    await act(async () => {
      const hookResult = renderHook(() => useCitadelState());
      result = hookResult.result;
    });

    const node = createMockNode('test');
    await act(async () => {
      result.current.actions.setCurrentInput('test');
      result.current.actions.setCurrentNode(node);
      result.current.actions.setIsEnteringArg(true);
    });

    expect(result.current.state.currentInput).toBe('test');
    expect(result.current.state.currentNode).toBe(node);
    expect(result.current.state.isEnteringArg).toBe(true);
  });

  it('should maintain immutability of state', async () => {
    const mockCommandTrie = createMockCommandTrie();
    vi.mocked(useCommandTrie).mockReturnValue(mockCommandTrie);

    let result: any;
    await act(async () => {
      const hookResult = renderHook(() => useCitadelState());
      result = hookResult.result;
    });

    const initialState = result.current.state;
    await act(async () => {
      result.current.actions.setCurrentInput('test');
    });

    expect(result.current.state).not.toBe(initialState);
    expect(result.current.state.currentInput).toBe('test');
  });

  it.skip('should execute a command from history', async () => {
    const mockCommand = {
      command: ['test', 'command', 'arg1'],
      timestamp: Date.now()
    };

    // Mock the command trie with a custom handler
    const mockHandler = vi.fn().mockResolvedValue(new JsonCommandResult({ data: 'test output' }));
    const mockCommandNode = createMockNode('command', { isLeaf: true, handler: mockHandler });
    const mockCommandTrie = createMockCommandTrie();
    vi.spyOn(mockCommandTrie, 'getCommand').mockImplementation((path: string[]) => {
      if (path[0] === 'test' && path[1] === 'command') {
        return mockCommandNode;
      }
      return undefined;
    });

    vi.mocked(useCommandTrie).mockReturnValue(mockCommandTrie);

    // Mock storage to resolve immediately
    const mockStorage = {
      addCommand: vi.fn().mockResolvedValue(undefined),
      getCommands: vi.fn().mockResolvedValue([mockCommand]),
      clear: vi.fn().mockResolvedValue(undefined)
    };
    vi.spyOn(StorageFactory.getInstance(), 'getStorage').mockReturnValue(mockStorage);

    let result: any;
    await act(async () => {
      const hookResult = renderHook(() => useCitadelState());
      result = hookResult.result;
    });

    // Set up history with a mock command
    await act(async () => {
      result.current.state.history.commands = [mockCommand];
    });

    // Execute the command from history
    await act(async () => {
      await result.current.actions.executeHistoryCommand(0);
    });

    // Verify the command was executed with correct path and args
    const lastOutput = result.current.state.output[result.current.state.output.length - 1];
    expect(lastOutput?.command).toEqual(['test', 'command', 'arg1']);
    expect(mockHandler).toHaveBeenCalledWith(['arg1'], expect.objectContaining({
      history: expect.any(Object)
    }));
  }, 10000); // Increase timeout to 10 seconds

  it('should handle invalid history index', async () => {
    const mockCommandTrie = createMockCommandTrie();
    vi.mocked(useCommandTrie).mockReturnValue(mockCommandTrie);

    let result: any;
    await act(async () => {
      const hookResult = renderHook(() => useCitadelState());
      result = hookResult.result;
    });

    const consoleSpy = vi.spyOn(console, 'warn');

    await act(async () => {
      await result.current.actions.executeHistoryCommand(999);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'No command found at history index 999'
    );
  });
});
