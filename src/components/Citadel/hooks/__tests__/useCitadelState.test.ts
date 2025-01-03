import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCitadelState } from '../useCitadelState';
import { useCommandTrie } from '../useCommandTrie';
import { createMockCommandTrie, createMockNode } from '../../../../__test-utils__/factories';
import { StorageFactory } from '../../storage/StorageFactory';
import { JsonCommandResult } from '../../types/command-results';
import { CommandNode } from '../../types/command-trie';
import { OutputItem } from '../../types/state';

// Mock CitadelConfigContext
vi.mock('../../config/CitadelConfigContext', () => ({
  useCitadelConfig: () => ({
    storage: { type: 'memory', maxCommands: 100 }
  })
}));

// Mock CitadelCommandsContext
vi.mock('../../config/CitadelCommandsContext', () => ({
  useCitadelCommands: () => ({})
}));

// Mock useCommandTrie
vi.mock('../useCommandTrie');

describe('useCitadelState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as jest.Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

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
        storage: undefined
      }
    };

    expect(result.current.state).toEqual(expectedState);
  });

  it('should handle setCommandStack action', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as jest.Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    const stack = ['test', 'command'];
    act(() => {
      result.current.actions.setCommandStack(stack);
    });

    expect(result.current.state.commandStack).toEqual(stack);
  });

  it('should handle setCurrentInput action', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as jest.Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    const input = 'test input';
    act(() => {
      result.current.actions.setCurrentInput(input);
    });

    expect(result.current.state.currentInput).toBe(input);
  });

  it('should handle setIsEnteringArg action', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as jest.Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    act(() => {
      result.current.actions.setIsEnteringArg(true);
    });

    expect(result.current.state.isEnteringArg).toBe(true);
  });

  it('should handle setCurrentNode action', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as jest.Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    const node = createMockNode('test');
    act(() => {
      result.current.actions.setCurrentNode(node);
    });

    expect(result.current.state.currentNode).toBe(node);
  });

  it('should handle addOutput action', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as jest.Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    const output = new OutputItem(['test', 'command']);
    output.result = new JsonCommandResult({ text: 'success' });

    act(() => {
      result.current.actions.addOutput(output);
    });

    expect(result.current.state.output).toHaveLength(1);
    expect(result.current.state.output[0]).toBe(output);
  });

  it('should handle setValidation action', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as jest.Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    const validation = { isValid: false, message: 'Invalid input' };
    act(() => {
      result.current.actions.setValidation(validation);
    });

    expect(result.current.state.validation).toEqual(validation);
  });

  it('should handle multiple actions in sequence', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as jest.Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    const node = createMockNode('test');
    act(() => {
      result.current.actions.setCurrentInput('test');
      result.current.actions.setCurrentNode(node);
      result.current.actions.setIsEnteringArg(true);
    });

    expect(result.current.state.currentInput).toBe('test');
    expect(result.current.state.currentNode).toBe(node);
    expect(result.current.state.isEnteringArg).toBe(true);
  });

  it('should execute a command from history', async () => {
    const mockCommandTrie = createMockCommandTrie();
    const mockCommand = createMockNode('test', {
      description: 'Test command',
      isLeaf: true,
      handler: async () => new JsonCommandResult({ text: 'success' })
    });
    (mockCommand as any)._fullPath = ['test', 'command'];

    // Mock getCommand to return the mock command
    vi.spyOn(mockCommandTrie, 'getCommand').mockImplementation((path) => {
      if (path.join('.') === 'test.command') {
        return mockCommand;
      }
      return undefined;
    });
    (useCommandTrie as jest.Mock).mockReturnValue(mockCommandTrie);

    // Mock history commands
    const mockStorage = {
      addCommand: vi.fn().mockResolvedValue(undefined),
      getCommands: vi.fn().mockResolvedValue([
        { node: mockCommand, args: ['arg1'], timestamp: Date.now() }
      ]),
      clear: vi.fn().mockResolvedValue(undefined)
    };
    vi.spyOn(StorageFactory.getInstance(), 'getStorage').mockReturnValue(mockStorage);

    const { result } = renderHook(() => useCitadelState());

    // Wait for history to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Execute the command from history
    await act(async () => {
      await result.current.actions.executeHistoryCommand(0);
    });

    expect(result.current.state.output).toHaveLength(1);
    expect(result.current.state.output[0].result?.data).toEqual({ text: 'success' });
  });

  it('should handle invalid history index', async () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as jest.Mock).mockReturnValue(mockCommandTrie);

    // Mock history commands
    const mockStorage = {
      addCommand: vi.fn().mockResolvedValue(undefined),
      getCommands: vi.fn().mockResolvedValue([]),
      clear: vi.fn().mockResolvedValue(undefined)
    };
    vi.spyOn(StorageFactory.getInstance(), 'getStorage').mockReturnValue(mockStorage);

    const { result } = renderHook(() => useCitadelState());

    // Wait for history to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.actions.executeHistoryCommand(999);
    });

    expect(result.current.state.output).toHaveLength(0);
  });

  it('should execute command from history on Enter', async () => {
    const mockCommandTrie = createMockCommandTrie();
    const mockHandler = vi.fn().mockResolvedValue(new JsonCommandResult({ text: 'success' }));
    const mockCommand = createMockNode('test', {
      description: 'Test command',
      isLeaf: true,
      handler: mockHandler
    });
    (mockCommand as any)._fullPath = ['test', 'command'];
    
    // Mock getCommand to return the mock command only for the correct path
    vi.spyOn(mockCommandTrie, 'getCommand').mockImplementation((path) => {
      if (path.join('.') === 'test.command') {
        return mockCommand;
      }
      return undefined;
    });
    (useCommandTrie as jest.Mock).mockReturnValue(mockCommandTrie);

    // Mock history commands
    const mockStorage = {
      addCommand: vi.fn().mockResolvedValue(undefined),
      getCommands: vi.fn().mockResolvedValue([
        { node: mockCommand, args: [], timestamp: 1 }
      ]),
      clear: vi.fn().mockResolvedValue(undefined)
    };
    vi.spyOn(StorageFactory.getInstance(), 'getStorage').mockReturnValue(mockStorage);

    const { result } = renderHook(() => useCitadelState());

    // Wait for history to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Navigate to command
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });

    // Execute command with Enter
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockHandler).toHaveBeenCalledWith([]);
    expect(result.current.state.output[0].result?.data).toEqual({ text: 'success' });
  });

  it('should handle keyboard navigation through history', async () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as jest.Mock).mockReturnValue(mockCommandTrie);

    // Create mock command nodes
    const mockCommand1 = createMockNode('test1', {
      description: 'Test command 1',
      isLeaf: true,
      handler: async () => ({ text: 'test1' })
    });
    (mockCommand1 as any)._fullPath = ['test', 'command1'];

    const mockCommand2 = createMockNode('test2', {
      description: 'Test command 2',
      isLeaf: true,
      handler: async () => ({ text: 'test2' })
    });
    (mockCommand2 as any)._fullPath = ['test', 'command2'];

    // Mock history commands
    const mockStorage = {
      addCommand: vi.fn().mockResolvedValue(undefined),
      getCommands: vi.fn().mockResolvedValue([
        { node: mockCommand1, args: [], timestamp: 1 },
        { node: mockCommand2, args: [], timestamp: 2 }
      ]),
      clear: vi.fn().mockResolvedValue(undefined)
    };
    vi.spyOn(StorageFactory.getInstance(), 'getStorage').mockReturnValue(mockStorage);

    const { result } = renderHook(() => useCitadelState());

    // Wait for history to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Mock ArrowUp key press
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });

    expect(result.current.state.currentInput).toBe('test command2');
    expect(result.current.state.history.position).toBe(1);

    // Mock ArrowUp key press again
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });

    expect(result.current.state.currentInput).toBe('test command1');
    expect(result.current.state.history.position).toBe(0);

    // Mock ArrowDown key press
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });

    expect(result.current.state.currentInput).toBe('test command2');
    expect(result.current.state.history.position).toBe(1);

    // Mock Escape key press
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.state.currentInput).toBe('');
    expect(result.current.state.history.position).toBe(null);
  });
});
