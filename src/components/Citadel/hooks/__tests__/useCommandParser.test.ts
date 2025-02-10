import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useCommandParser } from '../useCommandParser';
import { CommandNode, CommandSegment, CommandTrie } from '../../types/command-trie';
import { CitadelState, CitadelActions } from '../../types';
import { 
  createMockCitadelState, 
  createMockCommand,
  createMockKeyboardEvent,
  createTestCommand,
  createMockSegmentStack,
  createMockSegment,
  createMockCitadelActions
} from '../../../../__test-utils__/factories';
import { SegmentStack } from '../../types/segment-stack';

// Mock CitadelConfigContext before any tests
vi.mock('../../config/CitadelConfigContext', () => ({
  useCitadelConfig: () => ({
    storage: { type: 'memory', maxCommands: 100 },
    commandTimeoutMs: 5000
  }),
  useCitadelStorage: () => ({
    addStoredCommand: vi.fn().mockResolvedValue(undefined),
    getStoredCommands: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined)
  }),
  useCitadelCommands: () => new CommandTrie(),
  useSegmentStack: () => createMockSegmentStack(),
  useSegmentStackVersion: () => 1
}));

// TODO rm skip
describe.skip('useCommandParser', () => {
  let mockCommandTrie: CommandTrie;
  let mockState: CitadelState;
  let mockActions: CitadelActions;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Create a real CommandTrie with test commands
    mockCommandTrie = new CommandTrie();
    const mockCommands = [
      createTestCommand(['user', 'comment'], 'Add a comment to a user'),
      createTestCommand(['help'], 'Show help')
    ];

    // Add commands to the trie
    mockCommands.forEach(cmd => {
      mockCommandTrie.addCommand(cmd.segments, cmd.description || '', cmd.handler);
    });

    mockState = createMockCitadelState();
    mockActions = createMockCitadelActions();
  });

  describe('handleKeyDown', () => {
    it('should handle multiple quoted arguments', async () => {
      const mockCommand = createTestCommand(['user', 'comment']);

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockCommand);

      const stateWithArgs = {
        ...mockState,
        currentNode: mockCommand,
        currentInput: '"1234" "This is a comment"',
        isEnteringArg: true
      };

      const { result } = renderHook(() => useCommandParser());
      
      const mockEvent = createMockKeyboardEvent('Enter');
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArgs, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalled();
    });

    it('should handle mixed quote types', async () => {
      const mockNode = new CommandNode(
        [
          { type: 'word', name: 'user' },
          { type: 'word', name: 'comment' },
          { type: 'argument', name: 'userId', description: 'User ID' },
          { type: 'argument', name: 'comment', description: 'Comment text' }
        ],
        'Add a comment'
      );

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const stateWithArgs = {
        ...mockState,
        currentNode: mockNode,
        currentInput: '\'1234\' "This is a comment"',
        isEnteringArg: true,
        commandStack: ['user', 'comment'],
      };

      const { result } = renderHook(() => useCommandParser());
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArgs, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalled();
    });

    it('should handle quoted arguments', async () => {
      const mockNode = createMockCommand('test1', {
      });

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const stateWithArg = {
        ...mockState,
        currentNode: mockNode,
        currentInput: '"test argument with spaces"',
        isEnteringArg: true,
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser());
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArg, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalled();
    });

    it('should not complete command while quote is unclosed', async () => {
      const mockNode = createMockCommand('test1', { });

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const stateWithArg = {
        ...mockState,
        currentNode: mockNode,
        currentInput: '"unclosed quote',
        isEnteringArg: true,
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser());
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArg, mockActions);
      });

      expect(mockActions.executeCommand).not.toHaveBeenCalled();
    });

    it('should handle Enter for argument submission', async () => {
      const mockNode = createMockCommand('test1', { });

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const stateWithArg = {
        ...mockState,
        currentNode: mockNode,
        currentInput: 'arg1',
        isEnteringArg: true,
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser());
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArg, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalled();
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
      expect(mockActions.setIsEnteringArg).toHaveBeenCalledWith(false);
    });

    it('should handle Enter for current node without argument', async () => {
      const mockNode = createMockCommand('test1');

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const stateWithNode = {
        ...mockState,
        currentNode: mockNode,
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser());
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithNode, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalled();
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
    });

    it('should handle Enter for command without arguments', async () => {
      const mockNode = createMockCommand('test1');

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const stateWithCommand = {
        ...mockState,
        currentNode: mockNode,
        currentInput: '',  
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser());
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithCommand, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalled();
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
    });

    it('should prevent invalid command input', async () => {
      const stateWithInput = {
        ...mockState,
        currentInput: 'x',  // 'x' is not a valid command prefix
      };

      const { result } = renderHook(() => useCommandParser());
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'x' });
      let preventDefaultCalled = false;
      Object.defineProperty(mockEvent, 'preventDefault', {
        value: () => { preventDefaultCalled = true; }
      });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithInput, mockActions);
      });

      expect(preventDefaultCalled).toBe(true);
      expect(mockActions.setCurrentInput).not.toHaveBeenCalled();
    });

    it('should allow valid command prefixes', async () => {
      const stateWithInput = {
        ...mockState,
        currentInput: 'u',  // Valid prefix for 'user' command
      };

      const { result } = renderHook(() => useCommandParser());
      
      const mockEvent = new KeyboardEvent('keydown', { key: 's' });
      let preventDefaultCalled = false;
      Object.defineProperty(mockEvent, 'preventDefault', {
        value: () => { preventDefaultCalled = true; }
      });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithInput, mockActions);
      });

      expect(preventDefaultCalled).toBe(false);
    });

    it('should allow any input when entering arguments', async () => {
      const mockNode = createMockCommand('test1');

      const stateWithArg = {
        ...mockState,
        currentInput: 'some invalid command',
        commandStack: ['test1'],
        currentNode: mockNode,
        isEnteringArg: true,
      };

      const { result } = renderHook(() => useCommandParser());

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
      // Mock findMatchingCommands to return no matches
      const { result } = renderHook(() => useCommandParser());
      
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
          isEnteringArg: false,
        }, mockActions);
      });

      // Verify preventDefault was called, meaning the input was prevented
      expect(preventDefaultCalled).toBe(true);
    });
  });

  describe('getAutocompleteSuggestion', () => {
    it('should return exact match when input matches a command exactly', () => {
      const { result } = renderHook(() => useCommandParser());
      const suggestion = result.current.getAutocompleteSuggestion('help');
      expect(suggestion).toBe('help');
    });

    it('should return unique match when input is unambiguous prefix', () => {
      const { result } = renderHook(() => useCommandParser());
      const suggestion = result.current.getAutocompleteSuggestion('he');
      expect(suggestion).toBe('help');
    });

    it('should return null when input matches multiple commands', () => {
      // Add another command starting with 'h' to create ambiguity
      const trie = new CommandTrie();
      trie.addCommand(
        [{ type: 'word', name: 'help' }],
        'Help command'
      );
      trie.addCommand(
        [{ type: 'word', name: 'history' }],
        'History command'
      );

      const { result } = renderHook(() => useCommandParser());
      const suggestion = result.current.getAutocompleteSuggestion('h');
      expect(suggestion).toBeNull();
    });

    it('should return null when no commands match input', () => {
      const { result } = renderHook(() => useCommandParser());
      const suggestion = result.current.getAutocompleteSuggestion('xyz');
      expect(suggestion).toBeNull();
    });

    it('should be case insensitive', () => {
      const { result } = renderHook(() => useCommandParser());
      const suggestion = result.current.getAutocompleteSuggestion('HELP');
      expect(suggestion).toBe('help');
    });
  });


  describe('getAvailableNodes', () => {
    it('should return all root commands when no segments in stack', () => {
      // Create a real CommandTrie with test commands
      const trie = new CommandTrie();
      trie.addCommand(
        [ createMockSegment('word', 'user'),
          createMockSegment('word', 'show') ],
        'User show'
      );
      trie.addCommand(
        [ createMockSegment('word', 'user'),
          createMockSegment('word', 'deactivate') ],
        'User deactivate'
      );
      trie.addCommand(
        [ createMockSegment('word', 'help') ],
        'Help command'
      );

      // Override the mock to use our test trie
      const { result } = renderHook(() => useCommandParser());
      const availableNodes = result.current.getAvailableNodes();

      expect(availableNodes).toHaveLength(2);
      expect(availableNodes.map(node => node.segments[0].name)).toContain('user');
      expect(availableNodes.map(node => node.segments[0].name)).toContain('help');
    });

    it('should return next available nodes for a given command path', () => {
      const { result } = renderHook(() => useCommandParser());
      const stack = new SegmentStack();
      stack.push({ type: 'word', name: 'user' } as CommandSegment);

      const availableNodes = result.current.getAvailableNodes();

      expect(availableNodes).toHaveLength(1);
      expect(availableNodes[0].segments[1].name).toBe('comment');
    });

    it('should return empty array when no further commands available', () => {
      const { result } = renderHook(() => useCommandParser());
      const stack = new SegmentStack();
      stack.push({ type: 'word', name: 'help' } as CommandSegment);

      const availableNodes = result.current.getAvailableNodes();

      expect(availableNodes).toHaveLength(0);
    });
  });

  describe.skip('executeCommand', () => {
  });
});
