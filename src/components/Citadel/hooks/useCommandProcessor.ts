import { useCallback } from 'react';
import { Command } from '../../../services/commands/types/command';
import { CommandRegistry } from '../../../services/commands/CommandRegistry';

interface UseCommandProcessorProps {
  commandRegistry: CommandRegistry;
  actions: {
    setCommandStack: (stack: string[]) => void;
    setInput: (input: string) => void;
    setCurrentArg: (arg: any) => void;
    setAvailable: (available: Command[]) => void;
    setLoading: (loading: boolean) => void;
    addOutput: (output: any) => void;
    reset: () => void;
  };
}

export function useCommandProcessor({ commandRegistry, actions }: UseCommandProcessorProps) {
  // Get available commands at current level
  const getAvailableCommands = useCallback((stack: string[]) => {
    const commands = stack.length === 0 
      ? commandRegistry.getRootCommands()
      : commandRegistry.getSubcommands(stack);
    
    return commands
      .map(({ name, description }) => ({ name, description }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [commandRegistry]);

    // Get full command from stack
  const getCommandFromStack = useCallback((stack: string[]): Command | undefined => {
    if (stack.length === 0) return undefined;
    return commandRegistry.getCommandByPath(stack);
  }, [commandRegistry]);

  // Execute command
  const executeCommand = useCallback(async (commandStack: string[], args?: string[]) => {
    const result = await commandRegistry.executeCommand(commandStack, args || []);
    
    if (result) {
      actions.setLoading(true);
      try {
        actions.addOutput({
          command: [...commandStack, ...(args || [])].join(' '),
          response: result
        });
      } finally {
        actions.setLoading(false);
        actions.reset();
        initialize();
      }
    }
  }, [commandRegistry, actions]);

  // Update filtered commands
  const updateFilteredCommands = useCallback((value: string, available: Command[], commandStack: string[]) => {
    const filtered = available.filter(cmd =>
      cmd.name.toLowerCase().startsWith(value.toLowerCase())
    );
    
    if (filtered.length === 1) {
      const selectedCommand = filtered[0];
      const newStack = [...commandStack, selectedCommand.name];
      actions.setCommandStack(newStack);
      actions.setInput('');

      const command = getCommandFromStack(newStack);
      if (command?.args?.length) {
        actions.setCurrentArg(command.args[0]);
        actions.setAvailable([]); 
      } else if (command?.subcommands) {
        const nextCommands = getAvailableCommands(newStack);
        actions.setAvailable(nextCommands);
      }
    } else if (filtered.length > 0) {
      actions.setAvailable(filtered);
    }
  }, [actions, getAvailableCommands]);

  // Initialize commands
  const initialize = useCallback(() => {
    const availableCommands = getAvailableCommands([]);
    actions.setAvailable(availableCommands);
    actions.setInput('');
  }, [actions, getAvailableCommands]);

  return {
    getAvailableCommands,
    getCommandFromStack,
    executeCommand,
    updateFilteredCommands,
    initialize
  };
}