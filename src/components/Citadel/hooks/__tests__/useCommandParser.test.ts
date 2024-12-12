import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCommandParser } from '../useCommandParser';
import { CommandTrie } from '../../types/command-trie';
import { CitadelState, CitadelActions } from '../../types';
import { createMockNode, createMockCommandTrie } from '../../../../__test-utils__/factories';

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
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const mockNode = createMockNode('test1', {
        argument: {
          name: 'arg1',
          description: 'Test argument'
        }
      });

      (mockCommandTrie.getCommand as ReturnType<typeof vi.fn>).mockReturnValue(mockNode);

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
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const mockNode = createMockNode('test1');

      const stateWithNode = {
        ...mockState,
        currentInput: '',
        commandStack: ['test1'],
        currentNode: mockNode,
      };

      (mockCommandTrie.getCommand as ReturnType<typeof vi.fn>).mockReturnValue(mockNode);

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleKeyDown(mockEvent, stateWithNode, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], undefined);
    });

    it('should handle Enter for command without arguments', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const mockNode = createMockNode('test1');

      (mockCommandTrie.getCommand as ReturnType<typeof vi.fn>).mockReturnValue(mockNode);

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
      const mockEvent = new KeyboardEvent('keydown', { key: 'x' });
      Object.defineProperty(mockEvent, 'preventDefault', {
        value: mockPreventDefault,
      });

      const availableNodes = [
        createMockNode('test1'),
        createMockNode('test2'),
      ];
      (mockCommandTrie.getRootCommands as ReturnType<typeof vi.fn>).mockReturnValue(availableNodes);

      const stateWithInput = {
        ...mockState,
        currentInput: 'invalid',
      };

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleKeyDown(mockEvent, stateWithInput, mockActions);
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
      const mockEventWithPreventDefault = new KeyboardEvent('keydown', { key: 'x' });
      mockEventWithPreventDefault.preventDefault = () => { preventDefaultCalled = true; };
      
      act(() => {
        result.current.handleKeyDown(mockEventWithPreventDefault, stateWithArg, mockActions);
      });

      // Verify preventDefault was not called, meaning the input was allowed
      expect(preventDefaultCalled).toBe(false);
    });

    it('should prevent invalid command input when not entering arguments', () => {
      const mockNode = createMockNode('test1');

      // Mock findMatchingCommands to return no matches
      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      let preventDefaultCalled = false;
      const mockEventWithPreventDefault = new KeyboardEvent('keydown', { key: 'x' });
      mockEventWithPreventDefault.preventDefault = () => { preventDefaultCalled = true; };

      const stateWithInvalidCommand = {
        ...mockState,
        currentInput: 'invalid',
        currentNode: mockNode,
        isEnteringArg: false,
      };
      
      act(() => {
        result.current.handleKeyDown(mockEventWithPreventDefault, stateWithInvalidCommand, mockActions);
      });

      // Verify preventDefault was called, meaning the input was prevented
      expect(preventDefaultCalled).toBe(true);
    });
  });

  describe('executeCommand', () => {
    it('should execute command with handler', () => {
      const mockNode = createMockNode();

      (mockCommandTrie.getCommand as ReturnType<typeof vi.fn>).mockReturnValue(mockNode);

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

      (mockCommandTrie.getCommand as ReturnType<typeof vi.fn>).mockReturnValue(mockNode);

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.executeCommand(['test1'], mockActions, ['arg1']);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], ['arg1']);
    });
  });
});
