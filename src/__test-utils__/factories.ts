import { vi } from 'vitest';
import { CommandNode, CommandTrie, CommandNodeParams } from '../components/Citadel/types/command-trie';
import { CitadelState, CitadelActions } from '../components/Citadel/types';

export const createMockNode = (name: string = 'test1', overrides: Partial<CommandNodeParams> = {}): CommandNode => {
  const node = new CommandNode({
    fullPath: [name],
    description: 'Test command',
    handler: async () => ({ json: {} }),
    ...overrides
  });

  // Mock the methods
  vi.spyOn(node, 'addChild').mockImplementation(() => {});
  vi.spyOn(node, 'getChild').mockImplementation(() => undefined);

  return node;
};

export const createMockCommandTrie = (): CommandTrie => {
  const trie = new CommandTrie();

  // Mock the methods
  vi.spyOn(trie, 'getRootCommands').mockReturnValue([]);
  vi.spyOn(trie, 'getCommand').mockReturnValue(createMockNode());
  vi.spyOn(trie, 'addCommand').mockImplementation(() => {});
  vi.spyOn(trie, 'getCompletions').mockReturnValue([]);
  vi.spyOn(trie, 'getAllCommands').mockReturnValue([]);
  vi.spyOn(trie, 'executeCommand').mockResolvedValue(undefined);
  vi.spyOn(trie, 'getLeafCommands').mockReturnValue([]);
  vi.spyOn(trie, 'validate').mockReturnValue({ isValid: true, errors: [] });

  return trie;
};

export const createMockCitadelState = (overrides = {}): CitadelState => ({
  commandStack: [],
  currentInput: '',
  isEnteringArg: false,
  currentNode: undefined,
  output: [],
  validation: { isValid: true },
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
  ...overrides
});
