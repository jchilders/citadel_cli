import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CommandRegistry } from '../../../../services/commands/CommandRegistry';
import { useCommandProcessor } from '../../hooks/useCommandProcessor';
import { Command } from '../../types';

// Mock React hooks
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useCallback: (callback: Function) => callback,
  };
});

describe('useCommandProcessor', () => {
  let commandRegistry: CommandRegistry;
  let actions: any;
  let commandProcessor: ReturnType<typeof useCommandProcessor>;

  beforeEach(() => {
    commandRegistry = new CommandRegistry();
    actions = {
      setCommandStack: vi.fn(),
      setInput: vi.fn(),
      setCurrentArg: vi.fn(),
      setAvailable: vi.fn(),
      setLoading: vi.fn(),
      addOutput: vi.fn(),
      reset: vi.fn(),
    };

    commandProcessor = useCommandProcessor({ commandRegistry, actions });
  });

  it('should initialize with available root commands', () => {
    const rootCommands: Command[] = [
      { name: 'command1', description: 'desc1' },
      { name: 'command2', description: 'desc2' },
    ];
    expect(true).toBeTruthy();
    vi.spyOn(commandRegistry, 'getRootCommands').mockReturnValue(rootCommands);

    commandProcessor.initialize();

    expect(actions.setAvailable).toHaveBeenCalledWith(rootCommands);
    expect(actions.setInput).toHaveBeenCalledWith('');
  });

  it('should execute a command and handle output', async () => {
    const commandStack = ['command1'];
    const args = ['arg1'];
    const commandResult = 'result';
    vi.spyOn(commandRegistry, 'executeCommand').mockResolvedValue(commandResult);

    await commandProcessor.executeCommand(commandStack, args);

    expect(actions.setLoading).toHaveBeenCalledWith(true);
    expect(actions.addOutput).toHaveBeenCalledWith({
      command: 'command1 arg1',
      response: commandResult,
    });
    expect(actions.setLoading).toHaveBeenCalledWith(false);
    expect(actions.reset).toHaveBeenCalled();
  });

  it('should update filtered commands based on input', () => {
    const availableCommands: Command[] = [
      { name: 'command1', description: 'desc1' },
      { name: 'command2', description: 'desc2' },
    ];
    const commandStack: string[] = [];
    const inputValue = 'com';

    commandProcessor.updateFilteredCommands(inputValue, availableCommands, commandStack);

    expect(actions.setAvailable).toHaveBeenCalledWith(availableCommands);
  });
});