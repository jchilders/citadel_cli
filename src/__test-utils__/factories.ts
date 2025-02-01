import { CommandNode, CommandTrie, ArgumentSegment, CommandHandler } from '../components/Citadel/types/command-trie';
import { TextCommandResult } from '../components/Citadel/types/command-results';
import { CitadelState, CitadelActions } from '../components/Citadel/types';

interface MockNodeOptions {
  argument?: {
    name: string;
    description: string;
  };
  handler?: CommandHandler;
  description?: string;
  isLeaf?: boolean;
}

export const createMockNode = (name: string, options: MockNodeOptions = {}): CommandNode => {
  const defaultHandler: CommandHandler = async (_args: ArgumentSegment[]) => {
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
  const trie = new CommandTrie();
  const mockNode = createMockNode('test1');
  
  // Mock the public methods
  vi.spyOn(trie, 'getCommand').mockReturnValue(mockNode);
  vi.spyOn(trie, 'addCommand').mockImplementation(() => {});
  vi.spyOn(trie, 'getCompletions').mockReturnValue([]);
  vi.spyOn(trie, 'executeCommand').mockResolvedValue(undefined);

  return trie;
};

import { StoredCommand } from '../components/Citadel/types/storage';
export const createMockStoredCommand = (overrides = {}): StoredCommand => ({
  inputs: ['command1'],
  timestamp: Date.now(),
  ...overrides
});


import { CommandHistory, CommandHistoryActions } from '../components/Citadel/hooks/useCommandHistory';
export const createMockCommandHistory = (overrides = {}): CommandHistory => ({
  commands: [],
  position: null,
  savedInput: null,
  ...overrides
});

export const createMockCommandHistoryActions = (overrides = {}): CommandHistoryActions => ({
  addCommand: vi.fn(),
  getCommands: vi.fn(),
  navigateHistory: vi.fn(),
  saveInput: vi.fn(),
  clear: vi.fn(),
  ...overrides
});

export const createMockCitadelState = (overrides = {}): CitadelState => ({
  commandStack: [],
  currentInput: '',
  isEnteringArg: false,
  currentNode: undefined,
  output: [],
  validation: { isValid: true },
  segmentIndex: 0,
  history: {
    commands: [],
    position: null,
    savedInput: null,
    storage: undefined
  },
  ...overrides
});

export const createMockCitadelActions = (overrides = {}): CitadelActions => ({
  setCommandStack: vi.fn(),
  setCurrentInput: vi.fn(),
  setIsEnteringArg: vi.fn(),
  setCurrentNode: vi.fn(),
  addOutput: vi.fn(),
  setValidation: vi.fn(),
  executeCommand: vi.fn(),
  executeHistoryCommand: vi.fn(),
  clearHistory: vi.fn(),
  setCurrentSegmentIndex: vi.fn(),
  ...overrides
});
