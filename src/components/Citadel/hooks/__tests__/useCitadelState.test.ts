import { renderHook, act } from '@testing-library/react';
import { useCitadelState } from '../useCitadelState';
import { useCommandTrie } from '../useCommandTrie';
import { vi, Mock } from 'vitest'
import { createMockCommandTrie, createMockNode } from '../../../../__test-utils__/factories';
import { TextCommandResult } from '../../types/command-results';
import { OutputItem } from '../../types/state';

// Mock CitadelConfigContext
vi.mock('../../config/CitadelConfigContext', () => ({
  useCitadelConfig: () => ({
    storage: { type: 'memory', maxCommands: 100 }
  }),
  useCitadelStorage: () => ({
    addCommand: vi.fn().mockResolvedValue(undefined),
    getCommands: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined)
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
    (useCommandTrie as Mock).mockReturnValue(mockCommandTrie);

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
    (useCommandTrie as Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    const stack = ['test', 'command'];
    act(() => {
      result.current.actions.setCommandStack(stack);
    });

    expect(result.current.state.commandStack).toEqual(stack);
  });

  it('should handle setCurrentInput action', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    const input = 'test input';
    act(() => {
      result.current.actions.setCurrentInput(input);
    });

    expect(result.current.state.currentInput).toBe(input);
  });

  it('should handle setIsEnteringArg action', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    act(() => {
      result.current.actions.setIsEnteringArg(true);
    });

    expect(result.current.state.isEnteringArg).toBe(true);
  });

  it('should handle setCurrentNode action', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    const node = createMockNode('test');
    act(() => {
      result.current.actions.setCurrentNode(node);
    });

    expect(result.current.state.currentNode).toBe(node);
  });

  it('should handle addOutput action', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    const output = new OutputItem(['test', 'command']);
    output.result = new TextCommandResult('test output');

    act(() => {
      result.current.actions.addOutput(output);
    });

    expect(result.current.state.output).toHaveLength(1);
    expect(result.current.state.output[0]).toBe(output);
  });

  it('should handle setValidation action', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as Mock).mockReturnValue(mockCommandTrie);

    const { result } = renderHook(() => useCitadelState());

    const validation = { isValid: false, message: 'Invalid input' };
    act(() => {
      result.current.actions.setValidation(validation);
    });

    expect(result.current.state.validation).toEqual(validation);
  });

  it('should handle multiple actions in sequence', () => {
    const mockCommandTrie = createMockCommandTrie();
    (useCommandTrie as Mock).mockReturnValue(mockCommandTrie);

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
});
