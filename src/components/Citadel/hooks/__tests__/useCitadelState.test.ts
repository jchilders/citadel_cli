import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCitadelState } from '../useCitadelState';
import { OutputItem } from '../../types';
import { createMockNode } from '../../../../__test-utils__/factories';

describe('useCitadelState', () => {
  beforeEach(() => {
    // Reset all mocks and clear any side effects before each test
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCitadelState());

    expect(result.current.state).toEqual({
      commandStack: [],
      currentInput: '',
      isEnteringArg: false,
      currentNode: undefined,
      output: [],
      validation: { isValid: true },
    });
  });

  it('should handle setCommandStack action', () => {
    const { result } = renderHook(() => useCitadelState());
    const commandStack = ['command1', 'command2'];

    act(() => {
      result.current.actions.setCommandStack(commandStack);
    });

    expect(result.current.state.commandStack).toEqual(commandStack);
  });

  it('should handle setCurrentInput action', () => {
    const { result } = renderHook(() => useCitadelState());
    const input = 'test input';

    act(() => {
      result.current.actions.setCurrentInput(input);
    });

    expect(result.current.state.currentInput).toBe(input);
  });

  it('should handle setCurrentNode action', () => {
    const { result } = renderHook(() => useCitadelState());
    const node = createMockNode('test');

    act(() => {
      result.current.actions.setCurrentNode(node);
    });

    expect(result.current.state.currentNode).toBe(node);
  });

  it('should handle addOutput action', () => {
    const { result } = renderHook(() => useCitadelState());
    const output: OutputItem = {
      command: ['test'],
      result: { json: 'test output' },
      timestamp: Date.now(),
      status: 'success',
    };

    act(() => {
      result.current.actions.addOutput(output);
    });

    expect(result.current.state.output).toContainEqual(output);
  });

  it('should handle setValidation action', () => {
    const { result } = renderHook(() => useCitadelState());
    const validation = { isValid: false, message: 'Invalid input' };

    act(() => {
      result.current.actions.setValidation(validation);
    });

    expect(result.current.state.validation).toEqual(validation);
  });

  it('should handle multiple actions in sequence', () => {
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

  it('should maintain immutability of state', () => {
    const { result } = renderHook(() => useCitadelState());
    const initialState = { ...result.current.state };

    act(() => {
      result.current.actions.setCurrentInput('test');
    });

    expect(result.current.state).not.toBe(initialState);
    expect(initialState.currentInput).toBe('');
    expect(result.current.state.currentInput).toBe('test');
  });
});
