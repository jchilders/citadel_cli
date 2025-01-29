import { renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCommandParser } from '../useCommandParser';
import { CommandTrie } from '../../types/command-trie';
import { CitadelState, CitadelActions } from '../../types';
import { createMockNode, createMockCommandTrie, createMockCitadelState } from '../../../../__test-utils__/factories';

describe('useCommandParser', () => {
  let mockCommandTrie: CommandTrie;
  let mockState: CitadelState;
  let mockActions: CitadelActions;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mockCommandTrie = createMockCommandTrie();
    mockState = createMockCitadelState();
    mockActions = {
      setCommandStack: vi.fn(),
      setCurrentInput: vi.fn(),
      setIsEnteringArg: vi.fn(),
      setCurrentNode: vi.fn(),
      addOutput: vi.fn(),
      setValidation: vi.fn(),
      executeCommand: vi.fn(),
      executeHistoryCommand: vi.fn(),
      clearHistory: vi.fn()
    };
    user = userEvent.setup();
  });

  describe('handleKeyDown', () => {
    it('should handle Enter for argument submission', async () => {
      const mockNode = createMockNode('test1', {
        argument: {
          name: 'arg1',
          description: 'Test argument'
        }
      });

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const stateWithArg = {
        ...mockState,
        currentNode: mockNode,
        currentInput: 'arg1',
        isEnteringArg: true,
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArg, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], ['arg1']);
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
      expect(mockActions.setIsEnteringArg).toHaveBeenCalledWith(false);
    });

    it('should handle Enter for current node without argument', async () => {
      const mockNode = createMockNode('test1');

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const stateWithNode = {
        ...mockState,
        currentNode: mockNode,
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithNode, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], undefined);
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
    });

    it('should handle Enter for command without arguments', async () => {
      const mockNode = createMockNode('test1');

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const stateWithCommand = {
        ...mockState,
        currentNode: mockNode,
        currentInput: '',  
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithCommand, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], undefined);
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
    });

    it('should prevent invalid command input', async () => {
      vi.spyOn(mockCommandTrie, 'getCompletions').mockReturnValue(['test1', 'test2']);

      const stateWithInput = {
        ...mockState,
        currentInput: 'x',
      };

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
      const mockEvent = new KeyboardEvent('keydown');
      vi.spyOn(mockEvent, 'preventDefault');
      
      await act(async () => {
        await user.keyboard('x');
        result.current.handleKeyDown(mockEvent, stateWithInput, mockActions);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should allow any input when entering arguments', async () => {
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

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));

      let preventDefaultCalled = false;
      await act(async () => {
        await user.keyboard('x');
        const mockEvent = new KeyboardEvent('keydown');
        Object.defineProperty(mockEvent, 'preventDefault', {
          value: () => { preventDefaultCalled = true; }
        });
        result.current.handleKeyDown(mockEvent, stateWithArg, mockActions);
      });

      // Verify preventDefault was not called, meaning the input was allowed
      expect(preventDefaultCalled).toBe(false);
    });

    it('should prevent invalid command input when not entering arguments', async () => {
      const mockNode = createMockNode('test1');

      // Mock findMatchingCommands to return no matches
      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
      let preventDefaultCalled = false;
      const mockEvent = new KeyboardEvent('keydown');
      Object.defineProperty(mockEvent, 'preventDefault', {
        value: () => { preventDefaultCalled = true; }
      });
      
      await act(async () => {
        await user.keyboard('x');
        result.current.handleKeyDown(mockEvent, {
          ...mockState,
          currentInput: 'invalid',
          currentNode: mockNode,
          isEnteringArg: false,
        }, mockActions);
      });

      // Verify preventDefault was called, meaning the input was prevented
      expect(preventDefaultCalled).toBe(true);
    });
  });

  describe('executeCommand', () => {
    it('should execute command with handler', async () => {
      const mockNode = createMockNode('test1');

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
      await act(async () => {
        await user.keyboard('{enter}');
        result.current.executeCommand(['test1'], mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], undefined);
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
      expect(mockActions.setIsEnteringArg).toHaveBeenCalledWith(false);
    });

    it('should execute command with arguments', async () => {
      const mockNode = createMockNode('test1', {
        argument: {
          name: 'arg1',
          description: 'Test argument'
        }
      });

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
      await act(async () => {
        await user.keyboard('{enter}');
        result.current.executeCommand(['test1'], mockActions, ['arg1']);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], ['arg1']);
    });
  });
});
