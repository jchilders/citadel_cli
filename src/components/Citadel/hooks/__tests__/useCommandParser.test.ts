import { renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCommandParser } from '../useCommandParser';
import { CommandNode, CommandSegment, CommandTrie, NoopHandler } from '../../types/command-trie';
import { CitadelState, CitadelActions, TextCommandResult } from '../../types';
import { createMockNode, createMockCommandTrie, createMockCitadelState } from '../../../../__test-utils__/factories';

import { parseInput } from '../useCommandParser';
import { SegmentStack } from '../../types/segment-stack';

describe('useCommandParser', () => {
  describe('parseInput', () => {
    it('should parse unquoted input correctly', () => {
      const result = parseInput('user comment 1234 test');
      expect(result).toEqual({
        words: ['user', 'comment', '1234'],
        currentWord: 'test',
        isQuoted: false,
        quoteChar: undefined,
        isComplete: false
      });
    });

    it('should parse double-quoted input correctly', () => {
      const result = parseInput('user comment 1234 "A test comment"');
      expect(result).toEqual({
        words: ['user', 'comment', '1234', 'A test comment'],
        currentWord: '',
        isQuoted: false,
        quoteChar: undefined,
        isComplete: true
      });
    });

    it('should parse single-quoted input correctly', () => {
      const result = parseInput("user comment 1234 'A test comment'");
      expect(result).toEqual({
        words: ['user', 'comment', '1234', 'A test comment'],
        currentWord: '',
        isQuoted: false,
        quoteChar: undefined,
        isComplete: true
      });
    });

    it('should handle unclosed quotes', () => {
      const result = parseInput('user comment 1234 "unclosed quote');
      expect(result).toEqual({
        words: ['user', 'comment', '1234'],
        currentWord: 'unclosed quote',
        isQuoted: true,
        quoteChar: '"',
        isComplete: false
      });
    });

    it('should handle mixed quotes', () => {
      const result = parseInput('user comment "1234" \'test comment\'');
      expect(result).toEqual({
        words: ['user', 'comment', '1234', 'test comment'],
        currentWord: '',
        isQuoted: false,
        quoteChar: undefined,
        isComplete: true
      });
    });
  });

  let mockCommandTrie: CommandTrie;
  let mockState: CitadelState;
  let mockActions: CitadelActions;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mockCommandTrie = createMockCommandTrie();
    
    // Set up mock commands for testing
    const mockCommands = [
      new CommandNode(
        [
          { type: 'word', name: 'user' },
          { type: 'word', name: 'comment' },
          { type: 'argument', name: 'userId', description: 'User ID' },
          { type: 'argument', name: 'comment', description: 'Comment text' }
        ],
        'Add a comment to a user',
        async () => new TextCommandResult('Comment added')
      ),
      new CommandNode(
        [{ type: 'word', name: 'help' }],
        'Show help',
        async () => new TextCommandResult('Help text')
      )
    ];

    vi.spyOn(mockCommandTrie, 'commands', 'get').mockReturnValue(mockCommands);
    vi.spyOn(mockCommandTrie, 'getCommand').mockImplementation((path) => {
      return mockCommands.find(cmd => cmd.fullPath.join(' ') === path.join(' '));
    });
    vi.spyOn(mockCommandTrie, 'getCompletions_s').mockImplementation((path) => {
      if (path.length === 0) return ['user', 'help'];
      if (path[0] === 'user') return ['comment'];
      return [];
    });

    mockState = createMockCitadelState();
    mockActions = {
      setCommandStack: vi.fn(),
      setCurrentInput: vi.fn(),
      setIsEnteringArg: vi.fn(),
      addOutput: vi.fn(),
      executeCommand: vi.fn(),
      executeHistoryCommand: vi.fn(),
      clearHistory: vi.fn(),
    };
    user = userEvent.setup();
  });

  describe('handleKeyDown', () => {
    it('should handle multiple quoted arguments', async () => {
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
        currentInput: '"1234" "This is a comment"',
        isEnteringArg: true,
        commandStack: ['user', 'comment'],
      };

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArgs, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(
        ['user', 'comment'],
        ['1234', 'This is a comment']
      );
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

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArgs, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(
        ['user', 'comment'],
        ['1234', 'This is a comment']
      );
    });
    it('should handle quoted arguments', async () => {
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
        currentInput: '"test argument with spaces"',
        isEnteringArg: true,
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArg, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], ['test argument with spaces']);
    });

    it('should not complete command while quote is unclosed', async () => {
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
        currentInput: '"unclosed quote',
        isEnteringArg: true,
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArg, mockActions);
      });

      expect(mockActions.executeCommand).not.toHaveBeenCalled();
    });

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
      const stateWithInput = {
        ...mockState,
        currentInput: 'x',  // 'x' is not a valid command prefix
      };

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
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

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
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
          isEnteringArg: false,
        }, mockActions);
      });

      // Verify preventDefault was called, meaning the input was prevented
      expect(preventDefaultCalled).toBe(true);
    });
  });

  describe('getAutocompleteSuggestion', () => {
    it('should return exact match when input matches a command exactly', () => {
      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      const suggestion = result.current.getAutocompleteSuggestion('help');
      expect(suggestion).toBe('help');
    });

    it('should return unique match when input is unambiguous prefix', () => {
      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
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

      const { result } = renderHook(() => useCommandParser({ commands: trie }));
      const suggestion = result.current.getAutocompleteSuggestion('h');
      expect(suggestion).toBeNull();
    });

    it('should return null when no commands match input', () => {
      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      const suggestion = result.current.getAutocompleteSuggestion('xyz');
      expect(suggestion).toBeNull();
    });

    it('should be case insensitive', () => {
      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      const suggestion = result.current.getAutocompleteSuggestion('HELP');
      expect(suggestion).toBe('help');
    });
  });

  describe('getAvailableNodes', () => {
    it('should return all root commands when no segments in stack', () => {
      const trie = new CommandTrie();
      trie.addCommand(
        [
          {type: 'word', name: 'user'},
          {type: 'word', name: 'show'},
        ],
        'User show'
      );
      trie.addCommand(
        [
          {type: 'word', name: 'user'},
          {type: 'word', name: 'deactivate'},
        ],
        'User deactivate'
      );
      trie.addCommand(
        [
          {type: 'word', name: 'help'},
        ],
        'Help command'
      );
     
      const { result } = renderHook(() => useCommandParser({ commands: trie }));
      
      const availableNodes = result.current.getAvailableNodes();
      console.log("availableNodes", availableNodes);
      
      expect(availableNodes).toHaveLength(2); // 'user' and 'help' commands
      expect(availableNodes.map(node => node.segments[0].name)).toContain('user');
      expect(availableNodes.map(node => node.segments[0].name)).toContain('help');
    });

    it('should return next available nodes for a given command path', () => {
      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      const stack = new SegmentStack();
      stack.push({ type: 'word', name: 'user' } as CommandSegment);
      
      const availableNodes = result.current.getAvailableNodes();
      
      expect(availableNodes).toHaveLength(1);
      expect(availableNodes[0].segments[1].name).toBe('comment');
    });

    it('should return empty array when no further commands available', () => {
      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      const stack = new SegmentStack();
      stack.push({ type: 'word', name: 'help' } as CommandSegment);
      
      const availableNodes = result.current.getAvailableNodes(stack);
      
      expect(availableNodes).toHaveLength(0);
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
      const mockArg = {
        name: 'arg1',
        description: 'Test argument'
      } 
      const mockNode = createMockNode('test1', {
        argument: mockArg
      });

      vi.spyOn(mockCommandTrie, 'getCommand').mockReturnValue(mockNode);

      const { result } = renderHook(() => useCommandParser({ commands: mockCommandTrie }));
      
      await act(async () => {
        await user.keyboard('{enter}');
        result.current.executeCommand(['test1'], mockActions, [mockArg]);
      });

      expect(mockActions.executeCommand).toHaveBeenCalledWith(['test1'], ['arg1']);
    });
  });
});
