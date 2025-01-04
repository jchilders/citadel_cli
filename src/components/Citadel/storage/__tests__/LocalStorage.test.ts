import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LocalStorage } from '../LocalStorage';
import { CommandNode } from '../../types/command-trie';
import { StoredCommand } from '../../types/storage';
import { createMockNode } from '../../../../__test-utils__/factories';
import { TextCommandResult } from '../../types/command-results';

describe('LocalStorage', () => {
  let localStorage: LocalStorage;
  let mockRootNode: CommandNode;
  let mockChildNode: CommandNode;

  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();

    // Create mock nodes using factory
    mockChildNode = createMockNode('test', {
      description: 'Test command',
      isLeaf: true,
      handler: async () => {
        const result = new TextCommandResult('test output');
        result.markSuccess();
        return result;
      }
    });

    mockRootNode = createMockNode('root', {
      description: 'Root node',
      isLeaf: false
    });

    // Mock the children map for root node
    const childrenMap = new Map<string, CommandNode>([['test', mockChildNode]]);
    vi.spyOn(mockRootNode as any, '_children', 'get').mockReturnValue(childrenMap);

    // Mock the fullPath getter for child node
    vi.spyOn(mockChildNode as any, 'fullPath', 'get').mockReturnValue(['root', 'test']);

    // Mock the getChild method on root node
    vi.spyOn(mockRootNode, 'getChild').mockImplementation((name: string) => 
                                                          name === 'test' ? mockChildNode : undefined
                                                         );

    localStorage = new LocalStorage({ maxCommands: 2 }, mockRootNode);
  });

  it('should store and retrieve commands', async () => {
    const command: StoredCommand = {
      node: mockChildNode,
      args: ['arg1'],
      timestamp: Date.now()
    };

    await localStorage.addCommand(command);
    const commands = await localStorage.getCommands();

    expect(commands).toHaveLength(1);
    expect(commands[0].args).toEqual(command.args);
    expect(commands[0].timestamp).toEqual(command.timestamp);
    expect(commands[0].node.fullPath).toEqual(command.node.fullPath);
  });

  it('should enforce maxCommands limit', async () => {
    const mockCommand1 = createMockNode('test1', {
      description: 'Test command 1',
      isLeaf: true,
      handler: async () => {
        const result = new TextCommandResult('test output 1');
        result.markSuccess();
        return result;
      }
    });

    const mockCommand2 = createMockNode('test2', {
      description: 'Test command 2',
      isLeaf: true,
      handler: async () => {
        const result = new TextCommandResult('test output 2');
        result.markSuccess();
        return result;
      }
    });

    const mockCommand3 = createMockNode('test3', {
      description: 'Test command 3',
      isLeaf: true,
      handler: async () => {
        const result = new TextCommandResult('test output 3');
        result.markSuccess();
        return result;
      }
    });

    // Create a new root node for this test
    const testRootNode = createMockNode('root', {
      description: 'Root node',
      isLeaf: false
    });

    // Set up the children map with all test commands
    const childrenMap = new Map<string, CommandNode>([
      ['test1', mockCommand1],
      ['test2', mockCommand2],
      ['test3', mockCommand3]
    ]);
    vi.spyOn(testRootNode as any, '_children', 'get').mockReturnValue(childrenMap);

    // Mock fullPath getters for each command
    vi.spyOn(mockCommand1 as any, 'fullPath', 'get').mockReturnValue(['root', 'test1']);
    vi.spyOn(mockCommand2 as any, 'fullPath', 'get').mockReturnValue(['root', 'test2']);
    vi.spyOn(mockCommand3 as any, 'fullPath', 'get').mockReturnValue(['root', 'test3']);

    // Mock getChild to return the appropriate command
    vi.spyOn(testRootNode, 'getChild').mockImplementation((name: string) => {
      const commandMap = {
        'test1': mockCommand1,
        'test2': mockCommand2,
        'test3': mockCommand3
      };
      return commandMap[name];
    });

    const localStorage = new LocalStorage({ maxCommands: 2 }, testRootNode);

    const command1: StoredCommand = {
      node: mockCommand1,
      args: ['arg1'],
      timestamp: Date.now()
    };

    const command2: StoredCommand = {
      node: mockCommand2,
      args: ['arg2'],
      timestamp: Date.now()
    };

    const command3: StoredCommand = {
      node: mockCommand3,
      args: ['arg3'],
      timestamp: Date.now()
    };

    await localStorage.addCommand(command1);
    await localStorage.addCommand(command2);
    await localStorage.addCommand(command3);

    const commands = await localStorage.getCommands();
    expect(commands).toHaveLength(2);
    expect(commands[0].node.fullPath).toEqual(['root', 'test2']);
    expect(commands[1].node.fullPath).toEqual(['root', 'test3']);
  });

  it('should handle missing command nodes gracefully', async () => {
    const mockCommand = createMockNode('test', {
      description: 'Test command',
      isLeaf: true,
      handler: async () => {
        const result = new TextCommandResult('test output');
        result.markSuccess();
        return result;
      }
    });

    // Create a root node that doesn't have the command we'll try to deserialize
    const emptyRootNode = createMockNode('root', {
      description: 'Root node',
      isLeaf: false
    });

    // Mock an empty children map for the root node
    const emptyChildrenMap = new Map<string, CommandNode>();
    vi.spyOn(emptyRootNode as any, '_children', 'get').mockReturnValue(emptyChildrenMap);

    // Mock getChild to always return undefined (simulating missing command)
    vi.spyOn(emptyRootNode, 'getChild').mockReturnValue(undefined);

    // Mock fullPath getter for the command that will be stored
    vi.spyOn(mockCommand as any, 'fullPath', 'get').mockReturnValue(['root', 'test']);

    const localStorage = new LocalStorage({ maxCommands: 2 }, emptyRootNode);

    // Add a command that won't be found during deserialization
    const command: StoredCommand = {
      node: mockCommand,
      args: ['arg1'],
      timestamp: Date.now()
    };

    await localStorage.addCommand(command);
    const commands = await localStorage.getCommands();

    // Since the command node can't be found in the trie, it should be filtered out
    expect(commands).toHaveLength(0);
  });

  it('should clear storage', async () => {
    const mockCommand = createMockNode('test', {
      description: 'Test command',
      handler: async () => {
        const result = new TextCommandResult('test output');
        result.markSuccess();
        return result;
      }
    });


    const command: StoredCommand = {
      node: mockCommand,
      args: ['arg1'],
      timestamp: Date.now()
    };

    await localStorage.addCommand(command);
    await localStorage.clear();

    const commands = await localStorage.getCommands();
    expect(commands).toHaveLength(0);
  });
});
