import { CommandNode, CommandTrie, CommandHandler } from '../components/Citadel/types/command-trie';
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
  const defaultHandler: CommandHandler = async (_args: string[]) => {
    const result = new TextCommandResult('Success');
    result.markSuccess();
    return result;
  };

  // Create a mock handler that will be used in tests
  const mockHandler = options.handler || vi.fn(defaultHandler);

  const node = new CommandNode({
    fullPath: [name],
    description: options.description || 'Test command',
    argument: options.argument,
    handler: mockHandler
  });

  // Mock the children map - use Map as ReadonlyMap since ReadonlyMap can't be instantiated directly
  const childrenMap: ReadonlyMap<string, CommandNode> = new Map<string, CommandNode>();
  vi.spyOn(node as any, '_children', 'get').mockReturnValue(options.isLeaf ? new Map() : childrenMap);

  return node;
};

export const createMockCommandTrie = (): CommandTrie => {
  const trie = new CommandTrie();
  const mockNode = createMockNode('test1');
  
  // Mock the root node's children
  const rootNode = new CommandNode({
    fullPath: ['ROOT'],
    description: 'Root command node'
  });
  const rootChildrenMap: ReadonlyMap<string, CommandNode> = new Map<string, CommandNode>([['test1', mockNode]]);
  vi.spyOn(rootNode as any, '_children', 'get').mockReturnValue(rootChildrenMap);
  
  // Mock the trie's private root property
  vi.spyOn(trie as any, '_root', 'get').mockReturnValue(rootNode);
  
  // Mock the public methods
  vi.spyOn(trie, 'getCommand').mockReturnValue(mockNode);
  vi.spyOn(trie, 'addCommand').mockImplementation(() => {});
  vi.spyOn(trie, 'getCompletions').mockReturnValue([]);
  vi.spyOn(trie, 'executeCommand').mockResolvedValue(undefined);
  vi.spyOn(trie, 'getLeafCommands').mockReturnValue([]);
  vi.spyOn(trie, 'validate').mockReturnValue({ isValid: true, errors: [] });
  vi.spyOn(trie, 'getRootCommands').mockReturnValue([]);

  return trie;
};

import { StoredCommand } from '../components/Citadel/types/storage';
export const createMockStoredCommand = (overrides = {}): StoredCommand => ({
  path: ['command1'],
  args: [],
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
  ...overrides
});
