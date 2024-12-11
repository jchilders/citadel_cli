import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { useCommandParser } from '../useCommandParser';
import { CommandNode, CommandHandler, CommandArgument, CommandTrie } from '../../types/command-trie';
import { CitadelState, CitadelActions } from '../../types/state';

describe('useCommandParser', () => {
  const createMockNode = (): CommandNode & { [K in keyof CommandNode]: Mock } => {
    const node = new CommandNode({
      fullPath: ['test'],
      description: 'Test command'
    });

    // Override methods with spies
    const spies = {
      getName: vi.spyOn(node, 'getName') as Mock<string>,
      hasChildren: vi.spyOn(node, 'hasChildren') as Mock<boolean>,
      getChildren: vi.spyOn(node, 'getChildren') as Mock<Map<string, CommandNode>>,
      getHandler: vi.spyOn(node, 'getHandler') as Mock<CommandHandler | undefined>,
      getArgument: vi.spyOn(node, 'getArgument') as Mock<CommandArgument | undefined>,
      hasArgument: vi.spyOn(node, 'hasArgument') as Mock<boolean>,
      getDescription: vi.spyOn(node, 'getDescription') as Mock<string>,
      getFullPath: vi.spyOn(node, 'getFullPath') as Mock<string[]>,
      getParent: vi.spyOn(node, 'getParent') as Mock<CommandNode | undefined>
    };

    spies.getName.mockReturnValue('test');
    spies.hasChildren.mockReturnValue(false);
    spies.getChildren.mockReturnValue(new Map());
    spies.getHandler.mockReturnValue(() => Promise.resolve({}));
    spies.getArgument.mockReturnValue(undefined);
    spies.hasArgument.mockReturnValue(false);
    spies.getDescription.mockReturnValue('Test command');
    spies.getFullPath.mockReturnValue(['test']);
    spies.getParent.mockReturnValue(undefined);

    return Object.assign(node, spies);
  };

  let mockNode: ReturnType<typeof createMockNode>;
  let commandTrie: CommandTrie & { [K in keyof CommandTrie]: Mock };
  let mockState: CitadelState;
  let mockActions: CitadelActions;

  beforeEach(() => {
    mockNode = createMockNode();
    
    // Create a real CommandTrie instance but override its methods
    const trie = new CommandTrie();
    const spies = {
      getRootCommands: vi.spyOn(trie, 'getRootCommands') as Mock<CommandNode[]>,
      getCommand: vi.spyOn(trie, 'getCommand') as Mock<CommandNode>,
      addCommand: vi.spyOn(trie, 'addCommand') as Mock<void>,
      getCompletions: vi.spyOn(trie, 'getCompletions') as Mock<string[]>,
      getAllCommands: vi.spyOn(trie, 'getAllCommands') as Mock<CommandNode[]>,
      getLeafCommands: vi.spyOn(trie, 'getLeafCommands') as Mock<CommandNode[]>,
      validate: vi.spyOn(trie, 'validate') as Mock<{ isValid: boolean; errors: string[] }>
    };

    spies.getRootCommands.mockReturnValue([mockNode]);
    spies.getCommand.mockReturnValue(mockNode);
    spies.addCommand.mockImplementation(() => {});
    spies.getCompletions.mockReturnValue([]);
    spies.getAllCommands.mockReturnValue([]);
    spies.getLeafCommands.mockReturnValue([]);
    spies.validate.mockReturnValue({ isValid: true, errors: [] });

    commandTrie = Object.assign(trie, spies);

    mockState = {
      commandStack: [],
      currentInput: '',
      isEnteringArg: false,
      currentNode: undefined,
      output: [],
      validation: { isValid: true }
    };

    mockActions = {
      executeCommand: vi.fn(),
      setCurrentInput: vi.fn(),
      setIsEnteringArg: vi.fn(),
      setCommandStack: vi.fn(),
      setCurrentNode: vi.fn(),
      setValidation: vi.fn(),
      addOutput: vi.fn()
    };
  });

  describe('getAvailableNodes', () => {
    it('returns root commands when no current node', () => {
      const { result } = renderHook(() => useCommandParser({ commandTrie }));
      const rootCommands = [mockNode];
      commandTrie.getRootCommands.mockReturnValue(rootCommands);

      const nodes = result.current.getAvailableNodes();
      expect(nodes).toEqual(rootCommands);
    });

    it('returns child nodes when current node has children', () => {
      const { result } = renderHook(() => useCommandParser({ commandTrie }));
      const childNode = createMockNode();
      vi.spyOn(childNode, 'getName').mockReturnValue('child');
      const children = new Map([[childNode.getName(), childNode]]);
      vi.spyOn(mockNode, 'hasChildren').mockReturnValue(true);
      vi.spyOn(mockNode, 'getChildren').mockReturnValue(children);

      const nodes = result.current.getAvailableNodes(mockNode);
      expect(nodes).toEqual([childNode]);
    });
  });

  describe('input handling', () => {
    it('updates input without autocompletion when entering argument', () => {
      const { result } = renderHook(() => useCommandParser({ commandTrie }));
      const newValue = 'test input';
      mockState.isEnteringArg = true;
      
      act(() => {
        result.current.handleInputChange(newValue, mockState, mockActions);
      });
      
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith(newValue);
      expect(mockActions.setCommandStack).not.toHaveBeenCalled();
    });

    it('autocompletes when single match is found', () => {
      mockNode.getName.mockReturnValue('command');
      mockNode.hasChildren.mockReturnValue(false);
      mockNode.getArgument.mockReturnValue({ name: 'arg', type: 'string' });
      
      const { result } = renderHook(() => useCommandParser({ commandTrie }));
      
      act(() => {
        result.current.handleInputChange('com', mockState, mockActions);
      });
      
      expect(mockActions.setCommandStack).toHaveBeenCalledWith(['command']);
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
      expect(mockActions.setIsEnteringArg).toHaveBeenCalledWith(true);
    });
  });

  describe('key event handling', () => {
    it('handles Tab key for autocompletion', () => {
      const { result } = renderHook(() => useCommandParser({ commandTrie }));
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      mockState.currentInput = 'te';
      mockNode.getName.mockReturnValue('test');
      
      act(() => {
        result.current.handleKeyDown(event, mockState, mockActions);
      });
      
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('test');
    });

    it('handles Backspace key when input is empty', () => {
      const { result } = renderHook(() => useCommandParser({ commandTrie }));
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      mockState.currentInput = '';
      mockState.commandStack = ['test'];
      
      act(() => {
        result.current.handleKeyDown(event, mockState, mockActions);
      });
      
      expect(mockActions.setCommandStack).toHaveBeenCalledWith([]);
      expect(mockActions.setIsEnteringArg).toHaveBeenCalledWith(false);
    });

    it('handles Enter key for command execution with argument', () => {
      const { result } = renderHook(() => useCommandParser({ commandTrie }));
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      mockState.isEnteringArg = true;
      mockState.currentInput = 'arg value';
      mockState.commandStack = ['test'];
      mockNode.getHandler.mockReturnValue(() => Promise.resolve({}));
      mockState.currentNode = mockNode;
      commandTrie.getCommand.mockReturnValue(mockNode);
      
      act(() => {
        result.current.handleKeyDown(event, mockState, mockActions);
      });
      
      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test'], ['arg value']);
    });
  });

  describe('input state', () => {
    it('starts in idle state', () => {
      const { result } = renderHook(() => useCommandParser({ commandTrie }));
      expect(result.current.inputState).toBe('idle');
    });

    it('transitions to entering_argument state when argument is required', () => {
      const { result } = renderHook(() => useCommandParser({ commandTrie }));
      mockNode.getName.mockReturnValue('test');
      mockNode.getArgument.mockReturnValue({ name: 'arg', type: 'string' });
      mockNode.hasChildren.mockReturnValue(false);
      commandTrie.getRootCommands.mockReturnValue([mockNode]);
      
      // First simulate typing the command
      mockState.currentInput = 'test';
      mockState.isEnteringArg = false;
      
      // Then simulate pressing Enter to select the command
      act(() => {
        result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }), mockState, mockActions);
      });
      
      expect(result.current.inputState).toBe('entering_argument');
    });
  });
});
