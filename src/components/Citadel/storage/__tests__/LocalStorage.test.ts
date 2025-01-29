import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorage } from '../LocalStorage';
import { StoredCommand } from '../../types/storage';

describe('LocalStorage', () => {
  let localStorage: LocalStorage;

  beforeEach(() => {
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
