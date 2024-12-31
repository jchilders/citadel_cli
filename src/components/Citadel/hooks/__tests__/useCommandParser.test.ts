import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCommandParser } from '../useCommandParser';
import { CommandTrie } from '../../types/command-trie';
import { CitadelState, CitadelActions } from '../../types';
import { createMockNode, createMockCommandTrie } from '../../../../__test-utils__/factories';

// Create a mock KeyboardEvent for testing
const createMockKeyboardEvent = (key: string): KeyboardEvent => {
  return {
    key,
    preventDefault: vi.fn(),
    altKey: false,
    charCode: 0,
    code: key,
    ctrlKey: false,
    isComposing: false,
    keyCode: 0,
    location: 0,
    metaKey: false,
    repeat: false,
    shiftKey: false,
    which: 0,
    bubbles: true,
    cancelBubble: false,
    cancelable: true,
    composed: true,
    currentTarget: null,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: true,
    returnValue: true,
    srcElement: null,
    target: null,
    timeStamp: 0,
    type: 'keydown',
    composedPath: () => [],
    initEvent: () => {},
    stopImmediatePropagation: () => {},
    stopPropagation: () => {},
    AT_TARGET: 0,
    BUBBLING_PHASE: 0,
    CAPTURING_PHASE: 0,
    NONE: 0,
  } as KeyboardEvent;
};

describe('useCommandParser', () => {
  let mockCommandTrie: CommandTrie;
  let mockState: CitadelState;
  let mockActions: CitadelActions;

  beforeEach(() => {
    mockCommandTrie = createMockCommandTrie();
    mockState = {
      commandStack: [],
      currentInput: '',
      isEnteringArg: false,
      currentNode: undefined,
      output: [],
      validation: { isValid: true },
    };
    mockActions = {
      setCommandStack: vi.fn(),
      setCurrentInput: vi.fn(),
      setIsEnteringArg: vi.fn(),
      setCurrentNode: vi.fn(),
      addOutput: vi.fn(),
      setValidation: vi.fn(),
      executeCommand: vi.fn(),
    };
  });

  describe('handleKeyDown', () => {
    it('should handle Enter for argument submission', () => {
      const mockEvent = createMockKeyboardEvent('Enter');
      const mockNode = createMockNode('test1', {
        argument: {
          name: 'arg1',
          description: 'Test argument'
        }
      });

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const stateWithArg = {
        ...mockState,
        currentInput: 'arg1',
        commandStack: ['test1'],
        currentNode: mockNode,
        isEnteringArg: true,
      };

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleKeyDown(mockEvent, stateWithArg, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], ['arg1']);
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
      expect(mockActions.setIsEnteringArg).toHaveBeenCalledWith(false);
    });

    it('should handle Enter for current node without argument', () => {
      const mockEvent = createMockKeyboardEvent('Enter');
      const mockNode = createMockNode('test1');

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const stateWithNode = {
        ...mockState,
        currentInput: '',
        commandStack: ['test1'],
        currentNode: mockNode,
      };

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleKeyDown(mockEvent, stateWithNode, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], undefined);
    });

    it('should handle Enter for command without arguments', () => {
      const mockEvent = createMockKeyboardEvent('Enter');
      const mockNode = createMockNode('test1');

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const stateWithCommand = {
        ...mockState,
        currentInput: '',
        commandStack: ['test1'],
        currentNode: mockNode,
      };

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleKeyDown(mockEvent, stateWithCommand, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], undefined);
    });

    it('should prevent invalid command input', () => {
      const mockPreventDefault = vi.fn();
      const mockEvent = createMockKeyboardEvent('x');
      const availableNodes = [
        createMockNode('test1'),
        createMockNode('test2'),
      ];
      vi.spyOn(mockCommandTrie, 'getRootCommands').mockReturnValue(availableNodes);

      const stateWithInput = {
        ...mockState,
        currentInput: 'invalid',
      };

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleKeyDown({ ...mockEvent, preventDefault: mockPreventDefault }, stateWithInput, mockActions);
      });

      expect(mockPreventDefault).toHaveBeenCalled();
    });

    it('should allow any input when entering arguments', () => {
      const mockNode = createMockNode('test1', {
        argument: {
          name: 'arg1',
          description: 'Test argument'
        }
      });

      const stateWithArg = {
        ...mockState,
        currentInput: 'some invalid command',
        commandStack: ['test1'],
        currentNode: mockNode,
        isEnteringArg: true,
      };

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));

      let preventDefaultCalled = false;
      const mockEventWithPreventDefault = createMockKeyboardEvent('x');
      
      act(() => {
        result.current.handleKeyDown({ ...mockEventWithPreventDefault, preventDefault: () => { preventDefaultCalled = true; } }, stateWithArg, mockActions);
      });

      // Verify preventDefault was not called, meaning the input was allowed
      expect(preventDefaultCalled).toBe(false);
    });

    it('should prevent invalid command input when not entering arguments', () => {
      const mockNode = createMockNode('test1');

      // Mock findMatchingCommands to return no matches
      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      let preventDefaultCalled = false;
      const mockEventWithPreventDefault = createMockKeyboardEvent('x');

      const stateWithInvalidCommand = {
        ...mockState,
        currentInput: 'invalid',
        currentNode: mockNode,
        isEnteringArg: false,
      };
      
      act(() => {
        result.current.handleKeyDown({ ...mockEventWithPreventDefault, preventDefault: () => { preventDefaultCalled = true; } }, stateWithInvalidCommand, mockActions);
      });

      // Verify preventDefault was called, meaning the input was prevented
      expect(preventDefaultCalled).toBe(true);
    });
  });

  describe('executeCommand', () => {
    it('should execute command with handler', () => {
      const mockNode = createMockNode();

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.executeCommand(['test1'], mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], undefined);
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
      expect(mockActions.setIsEnteringArg).toHaveBeenCalledWith(false);
    });

    it('should execute command with arguments', () => {
      const mockNode = createMockNode('test1', {
        argument: {
          name: 'arg1',
          description: 'Test argument'
        }
      });

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.executeCommand(['test1'], mockActions, ['arg1']);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], ['arg1']);
    });
  });
});
