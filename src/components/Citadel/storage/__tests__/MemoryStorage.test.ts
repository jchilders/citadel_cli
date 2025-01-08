import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorage } from '../MemoryStorage';
import { StoredCommand } from '../../types/storage';

describe('MemoryStorage', () => {
  let memoryStorage: MemoryStorage;

  beforeEach(() => {
    memoryStorage = new MemoryStorage({ maxCommands: 2 });
  });

  it('should store and retrieve commands', async () => {
    const command: StoredCommand = {
      path: ['test1'],
      args: ['arg1'],
      timestamp: Date.now()
    };

    await memoryStorage.addCommand(command);
    const commands = await memoryStorage.getCommands();

    expect(commands).toHaveLength(1);
    expect(commands[0].args).toEqual(command.args);
    expect(commands[0].timestamp).toEqual(command.timestamp);
    expect(commands[0].path).toEqual(command.path);
  });

  it('should enforce maxCommands limit', async () => {
    const command1: StoredCommand = {
      path: ['test1'],
      args: ['first'],
      timestamp: Date.now()
    };

    const command2: StoredCommand = {
      path: ['test2'],
      args: ['second'],
      timestamp: Date.now()
    };

    const command3: StoredCommand = {
      path: ['test3'],
      args: ['third'],
      timestamp: Date.now()
    };

    await memoryStorage.addCommand(command1);
    await memoryStorage.addCommand(command2);
    await memoryStorage.addCommand(command3);

    const commands = await memoryStorage.getCommands();
    expect(commands).toHaveLength(2);
    expect(commands[0].path).toEqual(command2.path);
    expect(commands[0].args).toEqual(command2.args);
    expect(commands[1].path).toEqual(command3.path);
    expect(commands[1].args).toEqual(command3.args);
  });

  it('should not allow external mutations of stored commands', async () => {
    const command: StoredCommand = {
      path: ['test1'],
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
      path: ['test1'],
      args: ['arg1'],
      timestamp: Date.now()
    };

    await memoryStorage.addCommand(command);
    await memoryStorage.clear();

    const commands = await memoryStorage.getCommands();
    expect(commands).toHaveLength(0);
  });
});
