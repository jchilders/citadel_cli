import { useCallback } from 'react';
import { Command, InputState, CommandInputActions } from '../types/command-types';

export function useCommandParser(commands: Command[]) {
  const findMatchingCommands = useCallback((input: string, availableCommands: Command[]): Command[] => {
    if (!input) return availableCommands;
    return availableCommands.filter(cmd => cmd.name.toLowerCase().startsWith(input.toLowerCase()));
  }, []);

  const getAutocompleteSuggestion = useCallback((input: string, availableCommands: Command[]): string | null => {
    const matches = findMatchingCommands(input, availableCommands);
    if (matches.length === 1) {
      return matches[0].name;
    }
    return null;
  }, [findMatchingCommands]);

  const getCurrentCommand = useCallback((stack: string[], rootCommands: Command[]): Command | null => {
    let current: Command | undefined;
    let available = rootCommands;

    for (const item of stack) {
      current = available.find(cmd => cmd.name === item);
      if (!current) return null;
      available = current.subcommands || [];
    }

    return current || null;
  }, []);

  const handleKeyDown = useCallback((
    e: KeyboardEvent,
    state: InputState,
    actions: CommandInputActions
  ) => {
    const { commandStack, currentInput, isEnteringArg, availableCommands } = state;

    if (e.key === 'Enter') {
      e.preventDefault();
      const currentCommand = getCurrentCommand(commandStack, commands);
      
      if (isEnteringArg) {
        if (currentCommand?.handler) {
          const newStack = [...commandStack, currentInput];
          actions.executeCommand(newStack, [currentInput]);
          actions.setCurrentInput('');
          actions.setIsEnteringArg(false);
        }
      } else {
        const matchingCommand = availableCommands.find(cmd => cmd.name === currentInput);
        if (matchingCommand) {
          const newStack = [...commandStack, currentInput];
          if (matchingCommand.handler && !matchingCommand.args) {
            actions.executeCommand(newStack);
            actions.setCommandStack([]);
          } else if (matchingCommand.args) {
            actions.setCommandStack(newStack);
            actions.setIsEnteringArg(true);
          } else if (matchingCommand.subcommands) {
            actions.setCommandStack(newStack);
          }
          actions.setCurrentInput('');
        }
      }
    }
  }, [commands, getCurrentCommand]);

  return {
    handleKeyDown,
    findMatchingCommands,
    getAutocompleteSuggestion,
    getCurrentCommand,
  };
}
