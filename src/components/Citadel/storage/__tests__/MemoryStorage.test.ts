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
      inputs: ['test1', 'arg1'],
      timestamp: Date.now()
    };

    await memoryStorage.addCommand(command);
    const commands = await memoryStorage.getCommands();

    expect(commands).toHaveLength(1);
    expect(commands[0].inputs).toEqual(command.inputs);
    expect(commands[0].timestamp).toEqual(command.timestamp);
  });

  it('should enforce maxCommands limit', async () => {
    const command1: StoredCommand = {
      inputs: ['test1', 'first'],
      timestamp: Date.now()
    };

    const command2: StoredCommand = {
      inputs: ['test2', 'second'],
      timestamp: Date.now()
    };

    const command3: StoredCommand = {
      inputs: ['test3', 'third'],
      timestamp: Date.now()
    };

    await memoryStorage.addCommand(command1);
    await memoryStorage.addCommand(command2);
    await memoryStorage.addCommand(command3);

    const commands = await memoryStorage.getCommands();
    expect(commands).toHaveLength(2);
    expect(commands[0].inputs).toEqual(command2.inputs);
    expect(commands[1].inputs).toEqual(command3.inputs);
  });

  it('should not allow external mutations of stored commands', async () => {
    const command: StoredCommand = {
      inputs: ['test1', 'arg1'],
      timestamp: Date.now()
    };

    await memoryStorage.addCommand(command);
    const commands = await memoryStorage.getCommands();
    
    // Attempt to modify the returned command
    commands[0].inputs.push('arg2');
    
    // Get commands again and verify the original is unchanged
    const newCommands = await memoryStorage.getCommands();
    expect(newCommands[0].inputs).toEqual(['test1', 'arg1']);
  });

  it('should clear storage', async () => {
    const command: StoredCommand = {
      inputs: ['test1', 'arg1'],
      timestamp: Date.now()
    };

    await memoryStorage.addCommand(command);
    await memoryStorage.clear();

    const commands = await memoryStorage.getCommands();
    expect(commands).toHaveLength(0);
  });
});
