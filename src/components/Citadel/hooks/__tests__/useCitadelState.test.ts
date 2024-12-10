import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCitadelState } from '../useCitadelState';
import { CommandArg, Command, OutputItem } from '../../types';

describe('useCitadelState', () => {
  beforeEach(() => {
    // Reset all mocks and clear any side effects before each test
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCitadelState());

    expect(result.current.state).toEqual({
      isOpen: false,
      isClosing: false,
      commandStack: [],
      currentArg: null,
      input: '',
      available: [],
      output: [],
      isLoading: false,
      inputValidation: { isValid: true },
    });
  });

  it('should handle OPEN action', () => {
    const { result } = renderHook(() => useCitadelState());

    act(() => {
      result.current.actions.open();
    });

    expect(result.current.state.isOpen).toBe(true);
    expect(result.current.state.isClosing).toBe(false);
  });

  it('should handle CLOSE action', () => {
    const { result } = renderHook(() => useCitadelState());

    act(() => {
      result.current.actions.close();
    });

    expect(result.current.state.isOpen).toBe(false);
    expect(result.current.state.isClosing).toBe(false);
  });

  it('should handle SET_CLOSING action', () => {
    const { result } = renderHook(() => useCitadelState());

    act(() => {
      result.current.actions.setClosing(true);
    });

    expect(result.current.state.isClosing).toBe(true);
  });

  it('should handle SET_COMMAND_STACK action', () => {
    const { result } = renderHook(() => useCitadelState());
    const commandStack = ['command1', 'command2'];

    act(() => {
      result.current.actions.setCommandStack(commandStack);
    });

    expect(result.current.state.commandStack).toEqual(commandStack);
  });

  it('should handle SET_CURRENT_ARG action', () => {
    const { result } = renderHook(() => useCitadelState());
    const arg: CommandArg = {
      name: 'testArg',
      type: 'string',
      required: true,
    };

    act(() => {
      result.current.actions.setCurrentArg(arg);
    });

    expect(result.current.state.currentArg).toEqual(arg);
  });

  it('should handle SET_INPUT action', () => {
    const { result } = renderHook(() => useCitadelState());
    const input = 'test input';

    act(() => {
      result.current.actions.setInput(input);
    });

    expect(result.current.state.input).toBe(input);
  });

  it('should handle SET_AVAILABLE action', () => {
    const { result } = renderHook(() => useCitadelState());
    const commands: Command[] = [
      { name: 'test', description: 'test command', execute: () => {} },
    ];

    act(() => {
      result.current.actions.setAvailable(commands);
    });

    expect(result.current.state.available).toEqual(commands);
  });

  it('should handle ADD_OUTPUT action', () => {
    const { result } = renderHook(() => useCitadelState());
    const output: OutputItem = {
      type: 'command',
      content: 'test output',
    };

    act(() => {
      result.current.actions.addOutput(output);
    });

    expect(result.current.state.output).toContainEqual(output);
  });

  it('should handle CLEAR_OUTPUT action', () => {
    const { result } = renderHook(() => useCitadelState());
    
    // First add some output
    act(() => {
      result.current.actions.addOutput({ type: 'command', content: 'test' });
    });

    // Then clear it
    act(() => {
      result.current.actions.clearOutput();
    });

    expect(result.current.state.output).toEqual([]);
  });

  it('should handle SET_LOADING action', () => {
    const { result } = renderHook(() => useCitadelState());

    act(() => {
      result.current.actions.setLoading(true);
    });

    expect(result.current.state.isLoading).toBe(true);
  });

  it('should handle SET_INPUT_VALIDATION action', () => {
    const { result } = renderHook(() => useCitadelState());
    const validation = { isValid: false, message: 'Invalid input' };

    act(() => {
      result.current.actions.setInputValidation(validation);
    });

    expect(result.current.state.inputValidation).toEqual(validation);
  });

  it('should handle multiple actions in sequence', () => {
    const { result } = renderHook(() => useCitadelState());

    act(() => {
      result.current.actions.open();
      result.current.actions.setInput('test');
      result.current.actions.setLoading(true);
    });

    expect(result.current.state.isOpen).toBe(true);
    expect(result.current.state.input).toBe('test');
    expect(result.current.state.isLoading).toBe(true);
  });

  it('should maintain immutability of state', () => {
    const { result } = renderHook(() => useCitadelState());
    const initialState = { ...result.current.state };

    act(() => {
      result.current.actions.setInput('test');
    });

    expect(result.current.state).not.toBe(initialState);
    expect(initialState.input).toBe('');
    expect(result.current.state.input).toBe('test');
  });
});
