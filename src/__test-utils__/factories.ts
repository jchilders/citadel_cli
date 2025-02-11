import { CommandNode, CommandRegistry, CommandHandler, WordSegment, ArgumentSegment, CommandSegment, NullSegment } from '../components/Citadel/types/command-registry';
import { TextCommandResult } from '../components/Citadel/types/command-results';
import { CitadelState, CitadelActions, OutputItem } from '../components/Citadel/types';
import { SegmentStack } from '../components/Citadel/types/segment-stack';
import { CommandHistory, CommandHistoryActions, useCommandHistory } from '../components/Citadel/hooks/useCommandHistory';
import { useCitadelState } from '../components/Citadel/hooks/useCitadelState';
import { renderHook } from '@testing-library/react';

interface MockNodeOptions {
  handler?: CommandHandler;
  description?: string;
}

export const createMockSegment = (
  type: 'word' | 'argument' | 'null', 
  name: string = 'test', 
  description?: string
): CommandSegment => {
  switch (type) {
    case 'word':
      return new WordSegment(name, description);
    case 'argument':
      return new ArgumentSegment(name, description);
    case 'null':
      return new NullSegment();
    default:
      throw new Error('Invalid segment type');
  }
};

export const createMockCommandSegment = (type: 'word' | 'argument', name: string, description?: string): CommandSegment => {
  return createMockSegment(type, name, description);
};

export const createMockCommand = (name: string, options: MockNodeOptions = {}): CommandNode => {
  const defaultHandler: CommandHandler = async (_args: string[]) => {
    const result = new TextCommandResult('Success');
    result.markSuccess();
    return result;
  };

  const mockHandler = options.handler || vi.fn(defaultHandler);

  const node = new CommandNode(
    [{type: 'word', name: name}],
    options.description || 'Test command',
    mockHandler
  );

  return node;
};

export const createMockCommandRegistry = (): CommandRegistry => {
  const commands = new CommandRegistry();
  const mockNode = createMockCommand('test1');
  
  // Mock the public methods
  vi.spyOn(commands, 'getCommand').mockReturnValue(mockNode);
  vi.spyOn(commands, 'addCommand').mockImplementation(() => {});
  vi.spyOn(commands, 'getCompletions_s').mockReturnValue([]);

  return commands;
};

import { StoredCommand } from '../components/Citadel/types/storage';
export const createMockStoredCommand = (overrides = {}): StoredCommand => ({
  commandSegments: [createMockCommandSegment('word', 'test-command')],
  timestamp: 1234567890,  // Fixed timestamp for testing
  ...overrides
});

export const createMockStorage = () => ({
  addStoredCommand: vi.fn().mockResolvedValue(undefined),
  getStoredCommands: vi.fn().mockResolvedValue([]),
  clear: vi.fn().mockResolvedValue(undefined)
});


export const createMockCommandHistory = (overrides = {}): CommandHistory => ({
  storedCommands: [],
  position: null,
  ...overrides
});

export const createMockCommandHistoryActions = (overrides = {}): CommandHistoryActions => ({
  addStoredCommand: vi.fn().mockResolvedValue(undefined),
  getStoredCommands: vi.fn().mockResolvedValue([]),
  navigateHistory: vi.fn().mockResolvedValue({ segments: [], position: null }),
  clear: vi.fn().mockResolvedValue(undefined),
  ...overrides
});

export const createMockCitadelState = (overrides = {}): CitadelState => ({
  currentInput: '',
  isEnteringArg: false,
  output: [],
  history: {
    commands: [],
    position: null,
    storage: undefined
  },
  ...overrides
});

export const createMockOutputItem = (command: string[] = ['test']) => {
  const stack = new SegmentStack();
  command.forEach(word => stack.push(new WordSegment(word)));
  return new OutputItem(stack);
};

export const setupCitadelStateHook = () => {
  const mockHistory = createMockCommandHistory();
  const mockActions = createMockCommandHistoryActions();
  const mockCommands = createMockCommandRegistry();
  const mockStack = createMockSegmentStack();
  
  // Mock the history hook before rendering
  vi.mocked(useCommandHistory).mockReturnValue({
    history: mockHistory,
    ...mockActions
  });

  // Create a wrapper component that provides the necessary context
  const hook = renderHook(() => useCitadelState(), {
    wrapper: ({ children }) => children
  });
  
  return {
    hook,
    mockHistory,
    mockActions,
    mockCommands,
    mockStack
  };
};

export const createMockCitadelActions = (overrides = {}): CitadelActions => ({
  setCurrentInput: vi.fn(),
  setIsEnteringArg: vi.fn(),
  addOutput: vi.fn(),
  executeCommand: vi.fn(),
  clearHistory: vi.fn(),
  ...overrides
});

export const createMockSegmentStack = (): SegmentStack => {
  const stack = new SegmentStack();
  
  // Spy on the main methods
  vi.spyOn(stack, 'push');
  vi.spyOn(stack, 'pop');
  vi.spyOn(stack, 'clear');
  vi.spyOn(stack, 'peek');
  
  return stack;
};

export const createMockKeyboardEvent = (key: string): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { key });
  Object.defineProperty(event, 'preventDefault', {
    value: () => { /* noop */ }
  });
  return event;
};

export const createTestCommand = (
  path: string[], 
  description: string = 'Test command',
  handler: CommandHandler = async () => new TextCommandResult('Success')
): CommandNode => {
  const segments = path.map(name => new WordSegment(name));
  return new CommandNode(segments, description, handler);
};
