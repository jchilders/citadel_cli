import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorage } from '../LocalStorage';
import { StoredCommand } from '../../types/storage';
import { WordSegment, ArgumentSegment } from '../../types/command-registry';

describe('LocalStorage', () => {
  let localStorage: LocalStorage;

  beforeEach(() => {
    window.localStorage.clear();
    localStorage = new LocalStorage({ maxCommands: 2 });
  });

  it('should store and retrieve commands', async () => {
    const command: StoredCommand = {
      commandSegments: [
        new WordSegment('test'),
        new ArgumentSegment('arg1')
      ],
      timestamp: Date.now()
    };

    await localStorage.addStoredCommand(command);
    const commands = await localStorage.getStoredCommands();

    expect(commands).toHaveLength(1);
    expect(commands[0].commandSegments).toEqual(command.commandSegments);
    expect(commands[0].timestamp).toEqual(command.timestamp);
  });

  it('should enforce maxCommands limit', async () => {
    const localStorage = new LocalStorage({ maxCommands: 2 });

    const command1: StoredCommand = {
      commandSegments: [
        new WordSegment('test1'),
        new ArgumentSegment('arg1')
      ],
      timestamp: Date.now()
    };

    const command2: StoredCommand = {
      commandSegments: [
        new WordSegment('test2'),
        new ArgumentSegment('arg2')
      ],
      timestamp: Date.now()
    };

    const command3: StoredCommand = {
      commandSegments: [
        new WordSegment('test3'),
        new ArgumentSegment('arg3')
      ],
      timestamp: Date.now()
    };

    await localStorage.addStoredCommand(command1);
    await localStorage.addStoredCommand(command2);
    await localStorage.addStoredCommand(command3);

    const commands = await localStorage.getStoredCommands();
    expect(commands).toHaveLength(2);
    expect(commands[0].commandSegments).toEqual([
      new WordSegment('test2'),
      new ArgumentSegment('arg2')
    ]);
    expect(commands[1].commandSegments).toEqual([
      new WordSegment('test3'),
      new ArgumentSegment('arg3')
    ]);
  });

  it('should clear storage', async () => {
    const command1: StoredCommand = {
      commandSegments: [
        new WordSegment('test1'),
        new ArgumentSegment('arg1')
      ],
      timestamp: Date.now()
    };

    await localStorage.addStoredCommand(command1);
    await localStorage.clear();

    const commands = await localStorage.getStoredCommands();
    expect(commands).toHaveLength(0);
  });
});
