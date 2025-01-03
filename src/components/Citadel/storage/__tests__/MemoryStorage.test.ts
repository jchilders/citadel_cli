import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorage } from '../MemoryStorage';
import { StoredCommand } from '../../types/storage';
import { CommandNode } from '../../types/command-trie';
import { createMockNode } from '../../../../__test-utils__/factories';

describe('MemoryStorage', () => {
  let memoryStorage: MemoryStorage;
  let mockNode: CommandNode;

  beforeEach(() => {
    mockNode = createMockNode('test', {
      description: 'Test command',
      isLeaf: true,
      handler: async () => ({ text: 'test' })
    });

    memoryStorage = new MemoryStorage({ maxCommands: 2 });
  });

  it('should store and retrieve commands', async () => {
    const command: StoredCommand = {
      node: mockNode,
      args: ['arg1'],
      timestamp: 1
    };

    await memoryStorage.addCommand(command);
    const commands = await memoryStorage.getCommands();

    expect(commands).toHaveLength(1);
    expect(commands[0].args).toEqual(command.args);
    expect(commands[0].timestamp).toEqual(command.timestamp);
    expect(commands[0].node._fullPath).toEqual(command.node._fullPath);
  });

  it('should enforce maxCommands limit', async () => {
    const command1: StoredCommand = {
      node: mockNode,
      args: ['first'],
      timestamp: 1
    };

    const command2: StoredCommand = {
      node: mockNode,
      args: ['second'],
      timestamp: 2
    };

    const command3: StoredCommand = {
      node: mockNode,
      args: ['third'],
      timestamp: 3
    };

    await memoryStorage.addCommand(command1);
    await memoryStorage.addCommand(command2);
    await memoryStorage.addCommand(command3);

    const commands = await memoryStorage.getCommands();
    expect(commands).toHaveLength(2);
    expect(commands[0].args).toEqual(command2.args);
    expect(commands[1].args).toEqual(command3.args);
    expect(commands[0].node._fullPath).toEqual(command2.node._fullPath);
    expect(commands[1].node._fullPath).toEqual(command3.node._fullPath);
  });

  it('should not allow external mutations of stored commands', async () => {
    const command: StoredCommand = {
      node: mockNode,
      args: ['arg1'],
      timestamp: 1
    };

    await memoryStorage.addCommand(command);
    const commands = await memoryStorage.getCommands();
    
    // Attempt to modify the returned command
    commands[0].args.push('arg2');
    
    // Get commands again and verify the original is unchanged
    const newCommands = await memoryStorage.getCommands();
    expect(newCommands[0].args).toEqual(['arg1']);
  });

  it('should clear storage', async () => {
    const command: StoredCommand = {
      node: mockNode,
      args: ['arg1'],
      timestamp: 1
    };

    await memoryStorage.addCommand(command);
    await memoryStorage.clear();

    const commands = await memoryStorage.getCommands();
    expect(commands).toHaveLength(0);
  });
});
