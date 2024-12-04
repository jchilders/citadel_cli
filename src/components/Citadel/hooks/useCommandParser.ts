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

  const handleInputChange = useCallback((
    newValue: string,
    state: InputState,
    actions: CommandInputActions
  ) => {
    actions.setCurrentInput(newValue);

    // Only auto-complete if we're not entering an argument
    if (!state.isEnteringArg) {
      const suggestion = getAutocompleteSuggestion(newValue, state.availableCommands);
      if (suggestion && suggestion !== newValue) {
        const matchingCommand = state.availableCommands.find(cmd => cmd.name === suggestion);
        if (matchingCommand) {
          // Update command stack and clear input
          const newStack = [...state.commandStack, suggestion];
          actions.setCommandStack(newStack);
          actions.setCurrentInput('');
          
          // Update available commands and reset arg entry if command doesn't need args
          if (matchingCommand.subcommands) {
            actions.setAvailableCommands(matchingCommand.subcommands);
            actions.setIsEnteringArg(false);  // Reset when switching to subcommands
          } else if (matchingCommand.handler && matchingCommand.args) {
            actions.setIsEnteringArg(true);
          } else {
            actions.setIsEnteringArg(false);  // Reset for commands without args
          }
        }
      }
    }
  }, [getAutocompleteSuggestion]);

  const handleKeyDown = useCallback((
    e: KeyboardEvent,
    state: InputState,
    actions: CommandInputActions
  ) => {
    const { commandStack, currentInput, isEnteringArg, availableCommands } = state;

    if (e.key === 'Backspace' && currentInput === '') {
      e.preventDefault();
      if (commandStack.length > 0) {
        // Remove the last command from the stack
        const newStack = commandStack.slice(0, -1);
        actions.setCommandStack(newStack);
        
        // Get the new available commands based on the updated stack
        let newAvailable = commands;
        if (newStack.length > 0) {
          // Get the parent command to show its subcommands
          const parentCommand = getCurrentCommand(newStack, commands);
          if (parentCommand?.subcommands) {
            newAvailable = parentCommand.subcommands;
          }
        }
        actions.setAvailableCommands(newAvailable);
        actions.setIsEnteringArg(false); // Reset arg entry mode when backspacing
      }
      return;
    }

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
    handleInputChange,
    findMatchingCommands,
    getAutocompleteSuggestion,
    getCurrentCommand,
  };
}
