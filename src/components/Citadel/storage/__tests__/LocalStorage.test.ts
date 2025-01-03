import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LocalStorage } from '../LocalStorage';
import { CommandNode } from '../../types/command-trie';
import { StoredCommand } from '../../types/storage';
import { createMockNode } from '../../../../__test-utils__/factories';

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
      handler: async () => ({ text: 'test' })
    });

    // Set the correct path for the child node
    (mockChildNode as any)._fullPath = ['root', 'test'];

    mockRootNode = createMockNode('root', {
      description: 'Root node',
      isLeaf: false
    });

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
      timestamp: 1
    };

    await localStorage.addCommand(command);
    const commands = await localStorage.getCommands();

    expect(commands).toHaveLength(1);
    expect(commands[0].args).toEqual(command.args);
    expect(commands[0].timestamp).toEqual(command.timestamp);
    expect(commands[0].node._fullPath).toEqual(command.node._fullPath);
  });

  it('should enforce maxCommands limit', async () => {
    const command1: StoredCommand = {
      node: mockChildNode,
      args: ['first'],
      timestamp: 1
    };

    const command2: StoredCommand = {
      node: mockChildNode,
      args: ['second'],
      timestamp: 2
    };

    const command3: StoredCommand = {
      node: mockChildNode,
      args: ['third'],
      timestamp: 3
    };

    await localStorage.addCommand(command1);
    await localStorage.addCommand(command2);
    await localStorage.addCommand(command3);

    const commands = await localStorage.getCommands();
    expect(commands).toHaveLength(2);
    expect(commands[0].args).toEqual(command2.args);
    expect(commands[1].args).toEqual(command3.args);
    expect(commands[0].node._fullPath).toEqual(command2.node._fullPath);
    expect(commands[1].node._fullPath).toEqual(command3.node._fullPath);
  });

  it('should handle missing command nodes gracefully', async () => {
    const command: StoredCommand = {
      node: mockChildNode,
      args: ['arg1'],
      timestamp: Date.now()
    };

    await localStorage.addCommand(command);

    // Create new storage instance without command trie
    const newStorage = new LocalStorage({ maxCommands: 2 });
    const commands = await newStorage.getCommands();

    expect(commands).toHaveLength(0);
  });

  it('should clear storage', async () => {
    const command: StoredCommand = {
      node: mockChildNode,
      args: ['arg1'],
      timestamp: Date.now()
    };

    await localStorage.addCommand(command);
    await localStorage.clear();

    const commands = await localStorage.getCommands();
    expect(commands).toHaveLength(0);
  });

  it('should update command node when setting command trie', async () => {
    const command: StoredCommand = {
      node: mockChildNode,
      args: ['arg1'],
      timestamp: 1
    };

    await localStorage.addCommand(command);

    // Create new storage and set command trie
    const newStorage = new LocalStorage({ maxCommands: 2 });
    newStorage.setCommandTrie(mockRootNode);

    const commands = await newStorage.getCommands();
    expect(commands).toHaveLength(1);
    expect(commands[0].args).toEqual(command.args);
    expect(commands[0].timestamp).toEqual(command.timestamp);
    expect(commands[0].node._fullPath).toEqual(command.node._fullPath);
  });
});
