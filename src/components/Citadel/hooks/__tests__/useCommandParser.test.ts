import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCommandParser } from '../useCommandParser';
import { CommandNode } from '../../types/command-trie';
import { CitadelState, CitadelActions } from '../../types';
import { CommandTrie } from '../../types/command-trie';

describe('useCommandParser', () => {
  let mockCommandTrie: CommandTrie;
  let mockState: CitadelState;
  let mockActions: CitadelActions;

  const createMockNode = (name: string = 'test1', overrides = {}) => ({
    name,
    _fullPath: [name],
    _description: 'Test command',
    _children: new Map(),
    _argument: undefined,
    _handler: vi.fn(),
    _parent: undefined,
    isLeaf: true,
    hasHandler: true,
    requiresArgument: false,
    parent: undefined,
    children: new Map(),
    hasChildren: false,
    fullPath: [name],
    description: 'Test command',
    argument: undefined,
    handler: vi.fn(),
    addChild: vi.fn(),
    getChild: vi.fn(),
    ...overrides
  } as unknown as CommandNode);

  beforeEach(() => {
    // Setup mock command trie
    mockCommandTrie = {
      getRootCommands: vi.fn(),
      getCommand: vi.fn(),
      addCommand: vi.fn(),
      getCommandNames: vi.fn(),
      getCommandsWithPrefix: vi.fn(),
    } as unknown as CommandTrie;

    // Setup default return values
    (mockCommandTrie.getRootCommands as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (mockCommandTrie.getCommand as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
    (mockCommandTrie.getCommandNames as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (mockCommandTrie.getCommandsWithPrefix as ReturnType<typeof vi.fn>).mockReturnValue([]);

    // Setup mock state
    mockState = {
      commandStack: [],
      currentInput: '',
      isEnteringArg: false,
      currentNode: undefined,
      output: [],
      validation: { isValid: true }
    };

    // Setup mock actions
    mockActions = {
      setCommandStack: vi.fn(),
      setCurrentInput: vi.fn(),
      setCurrentNode: vi.fn(),
      setIsEnteringArg: vi.fn(),
      executeCommand: vi.fn(),
      addOutput: vi.fn(),
      setValidation: vi.fn()
    };
  });

  describe('findMatchingCommands', () => {
    it('should return all available nodes when input is empty', () => {
      const availableNodes = [
        { name: 'test1' },
        { name: 'test2' },
      ] as CommandNode[];

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      const matches = result.current.findMatchingCommands('', availableNodes);
      expect(matches).toEqual(availableNodes);
    });

    it('should filter nodes based on input prefix case-insensitively', () => {
      const availableNodes = [
        { name: 'Test1' },
        { name: 'test2' },
        { name: 'other' },
      ] as CommandNode[];

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      const matches = result.current.findMatchingCommands('test', availableNodes);
      expect(matches).toHaveLength(2);
      expect(matches.map(n => n.name)).toContain('Test1');
      expect(matches.map(n => n.name)).toContain('test2');
    });
  });

  describe('getAutocompleteSuggestion', () => {
    it('should return null when no matches found', () => {
      const availableNodes = [
        { name: 'test1' },
        { name: 'test2' },
      ] as CommandNode[];

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      const suggestion = result.current.getAutocompleteSuggestion('xyz', availableNodes);
      expect(suggestion).toBeNull();
    });

    it('should return exact match when only one command matches', () => {
      const availableNodes = [
        { name: 'test1' },
        { name: 'other' },
      ] as CommandNode[];

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      const suggestion = result.current.getAutocompleteSuggestion('te', availableNodes);
      expect(suggestion).toBe('test1');
    });
  });

  describe('isValidCommandInput', () => {
    it('should return true when input matches available commands', () => {
      const availableNodes = [
        { name: 'test1' },
        { name: 'test2' },
      ] as CommandNode[];

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      expect(result.current.isValidCommandInput('test', availableNodes)).toBe(true);
    });

    it('should return false when input does not match any commands', () => {
      const availableNodes = [
        { name: 'test1' },
        { name: 'test2' },
      ] as CommandNode[];

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      expect(result.current.isValidCommandInput('xyz', availableNodes)).toBe(false);
    });
  });

  describe('handleInputChange', () => {
    it('should update current input', () => {
      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleInputChange('test', mockState, mockActions);
      });

      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('test');
    });

    it('should not autocomplete when entering argument', () => {
      const stateWithArg = { ...mockState, isEnteringArg: true };
      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleInputChange('test', stateWithArg, mockActions);
      });

      expect(mockActions.setCommandStack).not.toHaveBeenCalled();
      expect(mockActions.setCurrentNode).not.toHaveBeenCalled();
    });

    it('should autocomplete when single match is found', () => {
      const mockNode = createMockNode();
      const availableNodes = [mockNode];
      (mockCommandTrie.getRootCommands as ReturnType<typeof vi.fn>).mockReturnValue(availableNodes);
      (mockCommandTrie.getCommand as ReturnType<typeof vi.fn>).mockReturnValue(mockNode);
      
      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleInputChange('te', mockState, mockActions);
      });

      expect(mockActions.setCommandStack).toHaveBeenCalledWith(['test1']);
      expect(mockActions.setCurrentNode).toHaveBeenCalledWith(mockNode);
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
    });

    it('should handle node with no children', () => {
      const mockNode = createMockNode();
      (mockCommandTrie.getRootCommands as ReturnType<typeof vi.fn>).mockReturnValue([mockNode]);
      (mockCommandTrie.getCommand as ReturnType<typeof vi.fn>).mockReturnValue(mockNode);

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleInputChange('te', mockState, mockActions);
      });

      expect(mockActions.setCommandStack).toHaveBeenCalledWith(['test1']);
      expect(mockActions.setCurrentNode).toHaveBeenCalledWith(mockNode);
      expect(mockActions.setIsEnteringArg).toHaveBeenCalledWith(false);
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
    });

    it('should set input state to idle for non-argument nodes', () => {
      const mockNode = createMockNode();
      (mockCommandTrie.getRootCommands as ReturnType<typeof vi.fn>).mockReturnValue([mockNode]);
      (mockCommandTrie.getCommand as ReturnType<typeof vi.fn>).mockReturnValue(mockNode);

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleInputChange('te', mockState, mockActions);
      });

      expect(result.current.inputState).toBe('idle');
    });
  });

  describe('handleKeyDown', () => {
    it('should handle Tab key for autocompletion', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      const availableNodes = [{ name: 'test1' }] as CommandNode[];
      (mockCommandTrie.getRootCommands as ReturnType<typeof vi.fn>).mockReturnValue(availableNodes);

      const stateWithInput = { ...mockState, currentInput: 'te' };
      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleKeyDown(mockEvent, stateWithInput, mockActions);
      });

      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('test1');
    });

    it('should handle Backspace for empty input', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      const stateWithStack = {
        ...mockState,
        currentInput: '',
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleKeyDown(mockEvent, stateWithStack, mockActions);
      });

      expect(mockActions.setCommandStack).toHaveBeenCalledWith([]);
      expect(mockActions.setCurrentNode).toHaveBeenCalledWith(undefined);
    });

    it('should handle Enter for command execution', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const mockNode = createMockNode();

      (mockCommandTrie.getCommand as ReturnType<typeof vi.fn>).mockReturnValue(mockNode);
      const availableNodes = [mockNode];
      (mockCommandTrie.getRootCommands as ReturnType<typeof vi.fn>).mockReturnValue(availableNodes);

      const stateWithCommand = {
        ...mockState,
        currentInput: 'test1',
        commandStack: [],
        currentNode: undefined,
      };

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleKeyDown(mockEvent, stateWithCommand, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], undefined);
    });

    it('should handle Enter for argument submission', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const mockNode = createMockNode('test1', { argument: true });

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
      const mockNode = createMockNode('test1', { argument: false });

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
      const mockNode = createMockNode('test1', { argument: false });

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
      const mockEvent = new KeyboardEvent('keydown', { key: 'x' });
      const mockPreventDefault = vi.fn();
      Object.defineProperty(mockEvent, 'preventDefault', {
        value: mockPreventDefault,
      });

      const availableNodes = [
        { name: 'test1' },
        { name: 'test2' },
      ] as CommandNode[];
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

    it('should allow input when entering argument', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'x' });
      const mockPreventDefault = vi.fn();
      Object.defineProperty(mockEvent, 'preventDefault', {
        value: mockPreventDefault,
      });

      const stateWithArg = {
        ...mockState,
        isEnteringArg: true,
        currentInput: 'some-arg',
      };

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleKeyDown(mockEvent, stateWithArg, mockActions);
      });

      expect(mockPreventDefault).not.toHaveBeenCalled();
    });

    it('should validate regular input against current commands', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'x' });
      const mockPreventDefault = vi.fn();
      Object.defineProperty(mockEvent, 'preventDefault', {
        value: mockPreventDefault,
      });

      const childNode = createMockNode('child1');
      const mockNode = createMockNode('test1', {
        hasChildren: true,
        children: new Map([
          ['child1', childNode]
        ])
      });

      const stateWithNode = {
        ...mockState,
        currentNode: mockNode,
        currentInput: 'chil',
        isEnteringArg: false,
      };

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.handleKeyDown(mockEvent, stateWithNode, mockActions);
      });

      // Since 'childx' is not a valid command, preventDefault should be called
      expect(mockPreventDefault).toHaveBeenCalled();
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
      const mockNode = createMockNode('test1', { argument: true });

      (mockCommandTrie.getCommand as ReturnType<typeof vi.fn>).mockReturnValue(mockNode);

      const { result } = renderHook(() => useCommandParser({ commandTrie: mockCommandTrie }));
      
      act(() => {
        result.current.executeCommand(['test1'], mockActions, ['arg1']);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], ['arg1']);
    });
  });
});
