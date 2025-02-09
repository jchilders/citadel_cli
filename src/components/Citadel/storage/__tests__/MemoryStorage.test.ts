import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorage } from '../MemoryStorage';
import { StoredCommand } from '../../types/storage';
import { WordSegment, ArgumentSegment } from '../../types/command-trie';

describe('MemoryStorage', () => {
  let memoryStorage: MemoryStorage;

  beforeEach(() => {
    memoryStorage = new MemoryStorage({ maxCommands: 2 });
  });

  it('should store and retrieve commands', async () => {
    const command: StoredCommand = {
      commandSegments: [
        new WordSegment('test1'),
        new ArgumentSegment('arg1')
      ],
      timestamp: Date.now()
    };

    await memoryStorage.addStoredCommand(command);
    const commands = await memoryStorage.getStoredCommands();

    expect(commands).toHaveLength(1);
    expect(commands[0].commandSegments).toEqual(command.commandSegments);
    expect(commands[0].timestamp).toEqual(command.timestamp);
  });

  it('should enforce maxCommands limit', async () => {
    const command1: StoredCommand = {
      commandSegments: [
        new WordSegment('test1'),
        new ArgumentSegment('first')
      ],
      timestamp: Date.now()
    };

    const command2: StoredCommand = {
      commandSegments: [
        new WordSegment('test2'),
        new ArgumentSegment('second')
      ],
      timestamp: Date.now()
    };

    const command3: StoredCommand = {
      commandSegments: [
        new WordSegment('test3'),
        new ArgumentSegment('third')
      ],
      timestamp: Date.now()
    };

    await memoryStorage.addStoredCommand(command1);
    await memoryStorage.addStoredCommand(command2);
    await memoryStorage.addStoredCommand(command3);

    const commands = await memoryStorage.getStoredCommands();
    expect(commands).toHaveLength(2);
    expect(commands[0].commandSegments).toEqual(command2.commandSegments);
    expect(commands[1].commandSegments).toEqual(command3.commandSegments);
  });

  it('should not allow external mutations of stored commands', async () => {
    const command1: StoredCommand = {
      commandSegments: [
        new WordSegment('test1'),
        new ArgumentSegment('first')
      ],
      timestamp: Date.now()
    };

    await memoryStorage.addStoredCommand(command1);
    const commands = await memoryStorage.getStoredCommands();
    
    // Attempt to modify the returned command
    commands[0].commandSegments.push(new ArgumentSegment('arg2'));
    
    // Get commands again and verify the original is unchanged
    const newCommands = await memoryStorage.getStoredCommands();
    expect(newCommands[0].commandSegments).toEqual([
      new WordSegment('test1'),
      new ArgumentSegment('first')
    ]);
  });

  it('should clear storage', async () => {
    const command1: StoredCommand = {
      commandSegments: [
        new WordSegment('test1'),
        new ArgumentSegment('first')
      ],
      timestamp: Date.now()
    };

    await memoryStorage.addStoredCommand(command1);
    await memoryStorage.clear();

    const commands = await memoryStorage.getStoredCommands();
    expect(commands).toHaveLength(0);
  });
});
