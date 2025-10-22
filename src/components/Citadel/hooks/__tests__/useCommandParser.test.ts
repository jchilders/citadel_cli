// The parser hook wires together multiple stateful hooks (Citadel state, segment stack,
// command registry, history). We hoist deterministic mocks for each dependency so every
// render reuses the same instances; in earlier iterations fresh factories caused infinite
// re-renders when dependencies changed by identity, eventually blowing the Vitest worker’s
// heap. The tests below lean on that shared mock surface to simulate sequential argument
// entry, history navigation, and autocomplete flows without triggering OOM behaviour.

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useCommandParser } from '../useCommandParser';
import { CommandNode, CommandRegistry, ArgumentSegment } from '../../types/command-registry';
import { CitadelState, CitadelActions } from '../../types';
import { 
  createMockCitadelState, 
  createMockCommand,
  createMockKeyboardEvent,
  createMockSegmentStack,
  createMockSegment,
  createMockCitadelActions
} from '../../../../__test-utils__/factories';
import { SegmentStack } from '../../types/segment-stack';

const {
  mockUseCitadelConfig,
  mockUseCitadelStorage,
  mockUseCitadelCommands,
  mockUseSegmentStack,
  mockUseSegmentStackVersion,
  mockUseCitadelState,
  mockUseCommandHistory
} = vi.hoisted(() => ({
  mockUseCitadelConfig: vi.fn(),
  mockUseCitadelStorage: vi.fn(),
  mockUseCitadelCommands: vi.fn(),
  mockUseSegmentStack: vi.fn(),
  mockUseSegmentStackVersion: vi.fn(() => 1),
  mockUseCitadelState: vi.fn(),
  mockUseCommandHistory: vi.fn()
}));

vi.mock('../../config/hooks', () => ({
  useCitadelConfig: mockUseCitadelConfig,
  useCitadelStorage: mockUseCitadelStorage,
  useCitadelCommands: mockUseCitadelCommands,
  useSegmentStack: mockUseSegmentStack,
  useSegmentStackVersion: mockUseSegmentStackVersion
}));

vi.mock('../useCitadelState', () => ({
  useCitadelState: mockUseCitadelState
}));

vi.mock('../useCommandHistory', () => ({
  useCommandHistory: mockUseCommandHistory
}));

// TODO rm skip
describe('useCommandParser', () => {
  let mockCommandRegistry: CommandRegistry;
  let mockState: CitadelState;
  let mockActions: CitadelActions;
  let mockSegmentStack: SegmentStack;
  let mockHistory: ReturnType<typeof mockUseCommandHistory>;
  let user: ReturnType<typeof userEvent.setup>;

  const setCommandPath = (...segments: string[]) => {
    mockSegmentStack.clear();
    segments.forEach(segment => {
      mockSegmentStack.push(createMockSegment('word', segment));
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    user = userEvent.setup();
    
    mockSegmentStack = createMockSegmentStack();
    mockUseSegmentStack.mockReturnValue(mockSegmentStack);
    mockUseSegmentStackVersion.mockReturnValue(1);

    mockCommandRegistry = new CommandRegistry();

    const userCommentSegments = [
      createMockSegment('word', 'user'),
      createMockSegment('word', 'comment'),
      createMockSegment('argument', 'userId', 'User ID'),
      createMockSegment('argument', 'comment', 'Comment text')
    ];
    mockCommandRegistry.addCommand(userCommentSegments, 'Add a comment to a user');

    const helpSegments = [createMockSegment('word', 'help')];
    mockCommandRegistry.addCommand(helpSegments, 'Show help');

    const testCommandSegments = [createMockSegment('word', 'test1')];
    mockCommandRegistry.addCommand(testCommandSegments, 'Test command without args');

    const testCommandWithArgSegments = [
      createMockSegment('word', 'test1'),
      createMockSegment('argument', 'value', 'Test value')
    ];
    mockCommandRegistry.addCommand(testCommandWithArgSegments, 'Test command with arg');
    mockUseCitadelCommands.mockReturnValue(mockCommandRegistry);

    mockUseCitadelConfig.mockReturnValue({
      storage: { type: 'memory', maxCommands: 100 },
      commandTimeoutMs: 5000
    });
    mockUseCitadelStorage.mockReturnValue(undefined);

    mockState = createMockCitadelState();
    mockActions = createMockCitadelActions();
    mockUseCitadelState.mockReturnValue({ state: mockState });

    mockHistory = {
      history: {
        storedCommands: [],
        position: null
      },
      addStoredCommand: vi.fn().mockResolvedValue(undefined),
      getStoredCommands: vi.fn().mockResolvedValue([]),
      navigateHistory: vi.fn().mockResolvedValue({ segments: null, position: null }),
      clear: vi.fn().mockResolvedValue(undefined)
    };
    mockUseCommandHistory.mockReturnValue(mockHistory);
  });

  describe('handleKeyDown', () => {
    it('should handle multiple quoted arguments', async () => {
      const commandWithArgs = new CommandNode(
        [
          createMockSegment('word', 'user'),
          createMockSegment('word', 'comment'),
          createMockSegment('argument', 'userId'),
          createMockSegment('argument', 'comment')
        ],
        'Add a comment'
      );

      vi.spyOn(mockCommandRegistry, 'getCommand').mockReturnValue(commandWithArgs);

      const { result } = renderHook(() => useCommandParser());
      setCommandPath('user', 'comment');

      const firstArgState = {
        ...mockState,
        currentNode: commandWithArgs,
        currentInput: '"1234"',
        isEnteringArg: true,
        commandStack: ['user', 'comment'],
      };

      const secondArgState = {
        ...mockState,
        currentNode: commandWithArgs,
        currentInput: '"This is a comment"',
        isEnteringArg: true,
        commandStack: ['user', 'comment'],
      };

      await act(async () => {
        await result.current.handleKeyDown(createMockKeyboardEvent('Enter'), firstArgState, mockActions);
      });

      expect(mockActions.executeCommand).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.handleKeyDown(createMockKeyboardEvent('Enter'), secondArgState, mockActions);
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

      vi.spyOn(mockCommandRegistry, 'getCommand').mockReturnValue(mockNode);

      const stateWithArgs = {
        ...mockState,
        currentNode: mockNode,
        currentInput: '"This is a comment"',
        isEnteringArg: true,
        commandStack: ['user', 'comment'],
      };

      const { result } = renderHook(() => useCommandParser());
      setCommandPath('user', 'comment');
      const firstArg = createMockSegment('argument', 'userId') as ArgumentSegment;
      firstArg.value = '1234';
      mockSegmentStack.push(firstArg);
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArgs, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalled();
    });

    it('should handle quoted arguments', async () => {
      const mockNode = createMockCommand('test1', {
      });

      vi.spyOn(mockCommandRegistry, 'getCommand').mockReturnValue(mockNode);

      const stateWithArg = {
        ...mockState,
        currentNode: mockNode,
        currentInput: '"test argument with spaces"',
        isEnteringArg: true,
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser());
      setCommandPath('test1');
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArg, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalled();
    });

    it('should not complete command while quote is unclosed', async () => {
      const mockNode = createMockCommand('test1', { });

      vi.spyOn(mockCommandRegistry, 'getCommand').mockReturnValue(mockNode);

      const stateWithArg = {
        ...mockState,
        currentNode: mockNode,
        currentInput: '"unclosed quote',
        isEnteringArg: true,
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser());
      setCommandPath('test1');
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithArg, mockActions);
      });

      expect(mockActions.executeCommand).not.toHaveBeenCalled();
    });

    it('should handle Enter for argument submission', async () => {
      const mockNode = createMockCommand('test1', { });

      vi.spyOn(mockCommandRegistry, 'getCommand').mockReturnValue(mockNode);

      const stateWithArg = {
        ...mockState,
        currentNode: mockNode,
        currentInput: 'arg1',
        isEnteringArg: true,
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser());
      setCommandPath('test1');
      
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

      vi.spyOn(mockCommandRegistry, 'getCommand').mockReturnValue(mockNode);

      const stateWithNode = {
        ...mockState,
        currentNode: mockNode,
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser());
      setCommandPath('test1');
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      await act(async () => {
        result.current.handleKeyDown(mockEvent, stateWithNode, mockActions);
      });

      expect(mockActions.executeCommand).toHaveBeenCalled();
      expect(mockActions.setCurrentInput).toHaveBeenCalledWith('');
    });

    it('should handle Enter for command without arguments', async () => {
      const mockNode = createMockCommand('test1');

      vi.spyOn(mockCommandRegistry, 'getCommand').mockReturnValue(mockNode);

      const stateWithCommand = {
        ...mockState,
        currentNode: mockNode,
        currentInput: '',  
        commandStack: ['test1'],
      };

      const { result } = renderHook(() => useCommandParser());
      setCommandPath('test1');
      
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
      
      const mockEvent = new KeyboardEvent('keydown', { key: 'x' });
      
      const handled = result.current.handleKeyDown(mockEvent, {
        ...mockState,
        currentInput: 'invalid',
        isEnteringArg: false,
      }, mockActions);

      expect(handled).toBe(false);
    });
  });

  describe('getAutocompleteSuggestion', () => {
    it('should return exact match when input matches a command exactly', () => {
      const { result } = renderHook(() => useCommandParser());
      const suggestion = result.current.getAutocompleteSuggestion('help');
      expect(suggestion.type).toBe('word');
      expect(suggestion.name).toBe('help');
    });

    it('should return unique match when input is unambiguous prefix', () => {
      const { result } = renderHook(() => useCommandParser());
      const suggestion = result.current.getAutocompleteSuggestion('he');
      expect(suggestion.type).toBe('word');
      expect(suggestion.name).toBe('help');
    });

    it('should return null when input matches multiple commands', () => {
      // Add another command starting with 'h' to create ambiguity
      const cmdRegistry = new CommandRegistry();
      cmdRegistry.addCommand(
        [{ type: 'word', name: 'help' }],
        'Help command'
      );
      cmdRegistry.addCommand(
        [{ type: 'word', name: 'history' }],
        'History command'
      );

      mockUseCitadelCommands.mockReturnValue(cmdRegistry);

      const { result } = renderHook(() => useCommandParser());
      const suggestion = result.current.getAutocompleteSuggestion('h');
      expect(suggestion).toBe(mockSegmentStack.nullSegment);
    });

    it('should return null when no commands match input', () => {
      const { result } = renderHook(() => useCommandParser());
      const suggestion = result.current.getAutocompleteSuggestion('xyz');
      expect(suggestion).toBe(mockSegmentStack.nullSegment);
    });

    it('should be case insensitive', () => {
      const { result } = renderHook(() => useCommandParser());
      const suggestion = result.current.getAutocompleteSuggestion('HELP');
      expect(suggestion.type).toBe('word');
      expect(suggestion.name).toBe('help');
    });
  });


  describe('getAvailableNodes', () => {
    it('should return all root commands when no segments in stack', () => {
      // Create a real CommandRegistry with test commands
      const cmdRegistry = new CommandRegistry();
      cmdRegistry.addCommand(
        [ createMockSegment('word', 'user'),
          createMockSegment('word', 'show') ],
        'User show'
      );
      cmdRegistry.addCommand(
        [ createMockSegment('word', 'user'),
          createMockSegment('word', 'deactivate') ],
        'User deactivate'
      );
      cmdRegistry.addCommand(
        [ createMockSegment('word', 'help') ],
        'Help command'
      );

      mockUseCitadelCommands.mockReturnValue(cmdRegistry);

      const { result } = renderHook(() => useCommandParser());
      const availableNodes = result.current.getAvailableNodes();
      expect(availableNodes.map(node => node.segments[0].name)).toEqual(['help']);
      expect(result.current.getNextExpectedSegment().name).toBe('user');
    });

    it('should return next available nodes for a given command path', () => {
      const { result } = renderHook(() => useCommandParser());
      mockSegmentStack.clear();
      mockSegmentStack.push(createMockSegment('word', 'user'));
      
      const availableNodes = result.current.getAvailableNodes();

      expect(availableNodes).toHaveLength(1);
      expect(availableNodes[0].segments[1].name).toBe('comment');
    });

    it('should return empty array when no further commands available', () => {
      const { result } = renderHook(() => useCommandParser());
      mockSegmentStack.clear();
      mockSegmentStack.push(createMockSegment('word', 'help'));
      
      const availableNodes = result.current.getAvailableNodes();

      expect(availableNodes).toHaveLength(0);
    });
  });

  describe.skip('executeCommand', () => {
  });
});
