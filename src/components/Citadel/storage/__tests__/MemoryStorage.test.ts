import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorage } from '../MemoryStorage';
import { StoredCommand } from '../../types/storage';
import { CommandNode } from '../../types/command-trie';
import { createMockNode } from '../../../../__test-utils__/factories';
import { TextCommandResult } from '../../types/command-results';

describe('MemoryStorage', () => {
  let memoryStorage: MemoryStorage;
  let mockNode: CommandNode;

  beforeEach(() => {
    mockNode = createMockNode('test', {
      description: 'Test command',
      isLeaf: true,
      handler: async () => {
        const result = new TextCommandResult('test output');
        result.markSuccess();
        return result;
      }
    });

    memoryStorage = new MemoryStorage({ maxCommands: 2 });
  });

  it('should store and retrieve commands', async () => {
    const command: StoredCommand = {
      node: mockNode,
      args: ['arg1'],
      timestamp: Date.now()
    };

    await memoryStorage.addCommand(command);
    const commands = await memoryStorage.getCommands();

    expect(commands).toHaveLength(1);
    expect(commands[0].args).toEqual(command.args);
    expect(commands[0].timestamp).toEqual(command.timestamp);
    expect(commands[0].node.fullPath).toEqual(command.node.fullPath);
  });

  it('should enforce maxCommands limit', async () => {
    const mockCommand1 = createMockNode('test1', {
      description: 'Test command 1',
      handler: async () => {
        const result = new TextCommandResult('test output 1');
        result.markSuccess();
        return result;
      }
    });

    const mockCommand2 = createMockNode('test2', {
      description: 'Test command 2',
      handler: async () => {
        const result = new TextCommandResult('test output 2');
        result.markSuccess();
        return result;
      }
    });

    const mockCommand3 = createMockNode('test3', {
      description: 'Test command 3',
      handler: async () => {
        const result = new TextCommandResult('test output 3');
        result.markSuccess();
        return result;
      }
    });

    const command1: StoredCommand = {
      node: mockCommand1,
      args: ['first'],
      timestamp: Date.now()
    };

    const command2: StoredCommand = {
      node: mockCommand2,
      args: ['second'],
      timestamp: Date.now()
    };

    const command3: StoredCommand = {
      node: mockCommand3,
      args: ['third'],
      timestamp: Date.now()
    };

    await memoryStorage.addCommand(command1);
    await memoryStorage.addCommand(command2);
    await memoryStorage.addCommand(command3);

    const commands = await memoryStorage.getCommands();
    expect(commands).toHaveLength(2);
    expect(commands[0].args).toEqual(command2.args);
    expect(commands[1].args).toEqual(command3.args);
    expect(commands[0].node.fullPath).toEqual(command2.node.fullPath);
    expect(commands[1].node.fullPath).toEqual(command3.node.fullPath);
  });

  it('should not allow external mutations of stored commands', async () => {
    const command: StoredCommand = {
      node: mockNode,
      args: ['arg1'],
      timestamp: Date.now()
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
      timestamp: Date.now()
    };

    await memoryStorage.addCommand(command);
    await memoryStorage.clear();

    const commands = await memoryStorage.getCommands();
    expect(commands).toHaveLength(0);
  });
});
