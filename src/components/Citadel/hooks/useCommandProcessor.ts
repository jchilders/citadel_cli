import { useCallback } from 'react';
import { Command, CommandConfig, CommandItem } from '../types';

interface UseCommandProcessorProps {
  commands: CommandConfig;
  actions: {
    setCommandStack: (stack: string[]) => void;
    setInput: (input: string) => void;
    setCurrentArg: (arg: any) => void;
    setAvailable: (available: CommandItem[]) => void;
    setLoading: (loading: boolean) => void;
    addOutput: (output: any) => void;
    reset: () => void;
  };
}

export function useCommandProcessor({ commands, actions }: UseCommandProcessorProps) {
  // Get available commands at current level
  const getAvailableCommands = useCallback((stack: string[]) => {
    let current: CommandConfig = commands;
    for (const cmd of stack) {
      const nextCommands = current[cmd]?.subcommands;
      if (!nextCommands) break;
      current = nextCommands;
    }
    return current ? Object.entries(current).map(([name, details]) => ({
      name,
      ...details
    }))
    .sort((a, b) => a.name.localeCompare(b.name)) : [];
  }, [commands]);

  // Get full command from stack
  const getCommandFromStack = useCallback((
    stack: string[], 
    commandConfig: CommandConfig
  ): Command | undefined => {
    let current: Command | undefined;
    let config = commandConfig;
  
    for (const cmd of stack) {
      current = config[cmd];
      if (current?.subcommands) {
        config = current.subcommands;
      }
    }
  
    return current;
  }, []);

  // Execute command
  const executeCommand = useCallback(async (commandStack: string[], args?: string[]) => {
    let current = commands;
    for (const cmd of commandStack) {
      if (!current[cmd]) return;
      if (current[cmd].handler) {
        actions.setLoading(true);
        try {
          const result = await current[cmd].handler(args || []);
          actions.addOutput({
            command: [...commandStack, ...(args || [])].join(' '),
            response: result
          });
        } finally {
          actions.setLoading(false);
          actions.reset();
          initialize();
        }
        return;
      }
      if (!current[cmd].subcommands) return;
      current = current[cmd].subcommands;
    }
  }, [commands, actions]);

  // Update filtered commands
  const updateFilteredCommands = useCallback((value: string, available: CommandItem[], commandStack: string[]) => {
    const filtered = available.filter(cmd =>
      cmd.name.toLowerCase().startsWith(value.toLowerCase())
    );
    
    if (filtered.length === 1) {
      const selectedCommand = filtered[0];
      const newStack = [...commandStack, selectedCommand.name];
      actions.setCommandStack(newStack);
      actions.setInput('');

      const command = getCommandFromStack(newStack, commands);
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
  }, [actions, commands, getAvailableCommands, getCommandFromStack]);

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