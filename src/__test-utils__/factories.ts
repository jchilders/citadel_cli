import { CommandNode, CommandTrie, CommandHandler, WordSegment, ArgumentSegment, CommandSegment } from '../components/Citadel/types/command-trie';
import { TextCommandResult } from '../components/Citadel/types/command-results';
import { CitadelState, CitadelActions } from '../components/Citadel/types';
import { SegmentStack } from '../components/Citadel/types/segment-stack';

interface MockNodeOptions {
  handler?: CommandHandler;
  description?: string;
}

export const createMockCommandSegment = (type: 'word' | 'argument', name: string, description?: string): CommandSegment => {
  switch (type) {
    case 'word':
      return new WordSegment(name, description);
    case 'argument':
      return new ArgumentSegment(name, description);
    default:
      throw new Error('Invalid segment type');
  }
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

export const createMockCommandTrie = (): CommandTrie => {
  const commands = new CommandTrie();
  const mockNode = createMockCommand('test1');
  
  // Mock the public methods
  vi.spyOn(commands, 'getCommand').mockReturnValue(mockNode);
  vi.spyOn(commands, 'addCommand').mockImplementation(() => {});
  vi.spyOn(commands, 'getCompletions_s').mockReturnValue([]);

  return commands;
};

import { StoredCommand } from '../components/Citadel/types/storage';
export const createMockStoredCommand = (overrides = {}): StoredCommand => ({
  inputs: ['command1'],
  timestamp: Date.now(),
  ...overrides
});


import { CommandHistory, CommandHistoryActions } from '../components/Citadel/hooks/useCommandHistory';
export const createMockCommandHistory = (overrides = {}): CommandHistory => ({
  storedCommands: [],
  position: null,
  savedInput: null,
  ...overrides
});

export const createMockCommandHistoryActions = (overrides = {}): CommandHistoryActions => ({
  addStoredCommand: vi.fn(),
  getStoredCommands: vi.fn(),
  navigateHistory: vi.fn(),
  saveInput: vi.fn(),
  clear: vi.fn(),
  ...overrides
});

export const createMockCitadelState = (overrides = {}): CitadelState => ({
  currentInput: '',
  isEnteringArg: false,
  output: [],
  history: {
    commands: [],
    position: null,
    savedInput: null,
    storage: undefined
  },
  ...overrides
});

export const createMockCitadelActions = (overrides = {}): CitadelActions => ({
  setCurrentInput: vi.fn(),
  setIsEnteringArg: vi.fn(),
  addOutput: vi.fn(),
  executeCommand: vi.fn(),
  executeHistoryCommand: vi.fn(),
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
