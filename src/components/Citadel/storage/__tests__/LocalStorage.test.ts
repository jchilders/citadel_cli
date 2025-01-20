import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LocalStorage } from '../LocalStorage';
import { CommandNode } from '../../types/command-trie';
import { StoredCommand } from '../../types/storage';
import { createMockNode } from '../../../../__test-utils__/factories';
import { TextCommandResult } from '../../types/command-results';

describe('LocalStorage', () => {
  let localStorage: LocalStorage;

  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    localStorage = new LocalStorage({ maxCommands: 2 });
  });

  it('should store and retrieve commands', async () => {
    const command: StoredCommand = {
      inputs: ['test', 'arg1'],
      timestamp: Date.now()
    };

    await localStorage.addCommand(command);
    const commands = await localStorage.getCommands();

    expect(commands).toHaveLength(1);
    expect(commands[0].inputs).toEqual(command.inputs);
    expect(commands[0].timestamp).toEqual(command.timestamp);
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

    // Mock getChild to return the appropriate command
    vi.spyOn(testRootNode, 'getChild').mockImplementation((name: string) => {
      const commandMap: Record<string, CommandNode> = {
        'test1': mockCommand1,
        'test2': mockCommand2,
        'test3': mockCommand3
      };
      return commandMap[name] || null;
    });

    const localStorage = new LocalStorage({ maxCommands: 2 });

    const command1: StoredCommand = {
      inputs: ['test1', 'arg1'],
      timestamp: Date.now()
    };

    const command2: StoredCommand = {
      inputs: ['test2', 'arg2'],
      timestamp: Date.now()
    };

    const command3: StoredCommand = {
      inputs: ['test3', 'arg3'],
      timestamp: Date.now()
    };

    await localStorage.addCommand(command1);
    await localStorage.addCommand(command2);
    await localStorage.addCommand(command3);

    const commands = await localStorage.getCommands();
    expect(commands).toHaveLength(2);
    expect(commands[0].inputs).toEqual(['test2', 'arg2']);
    expect(commands[1].inputs).toEqual(['test3', 'arg3']);
  });

  it('should clear storage', async () => {
    const command: StoredCommand = {
      inputs: ['test', 'arg1'],
      timestamp: Date.now()
    };

    await localStorage.addCommand(command);
    await localStorage.clear();

    const commands = await localStorage.getCommands();
    expect(commands).toHaveLength(0);
  });
});
