import { useCallback, useEffect } from 'react';
import { Command } from '../../../services/commands/types/command';
import { CommandRegistry } from '../../../services/commands/CommandRegistry';
import { CitadelState } from '../types';
import { CommandValidationStrategy } from '../validation/command_validation_strategy';

export interface UseCitadelKeyboardProps {
  state: CitadelState;
  validationStrategy: CommandValidationStrategy;
  commandRegistry: CommandRegistry;
  actions: {
    open: () => void;
    setClosing: (closing: boolean) => void;
    close: () => void;
    reset: () => void;
    setCommandStack: (stack: string[]) => void;
    setInput: (input: string) => void;
    setCurrentArg: (arg: any) => void;
    setAvailable: (available: Command[]) => void;
    setInputValidation: (validation: { isValid: boolean; message?: string }) => void;
  };
  commandProcessor: {
    getAvailableCommands: (stack: string[]) => Command[];
    getCommandFromStack: (stack: string[], commands: Command[]) => any;
    executeCommand: (stack: string[], args?: string[]) => Promise<void>;
    updateFilteredCommands: (input: string, available: Command[], stack: string[]) => void;
  };
}

export function useCitadelKeyboard({
  state,
  validationStrategy,
  commandRegistry,
  actions,
  commandProcessor
}: UseCitadelKeyboardProps) {
  const handleEnter = useCallback(async () => {
    const command = commandRegistry.getCommandByPath(state.commandStack);
    if (command?.args && state.currentArg) {
      if (state.input.trim()) {
        await commandProcessor.executeCommand(state.commandStack, [state.input]);
      }
    } else if (!command?.args && !state.currentArg) {
      await commandProcessor.executeCommand(state.commandStack, []);
    } 
  }, [state.commandStack, state.input, state.available, state.currentArg, commandRegistry, actions, commandProcessor]);

  // Helper function to handle input updates
  const handleInputUpdate = useCallback((newInput: string) => {
    actions.setInput(newInput);
    if (!state.currentArg) {
      commandProcessor.updateFilteredCommands(newInput, state.available, state.commandStack);
    }
  }, [actions, state.currentArg, commandProcessor, state.available, state.commandStack]);

  const handleKeyDown = useCallback(async (e: KeyboardEvent) => {
    if (!state.isOpen) {
      if (e.key === '.') {
        e.preventDefault();
        actions.open();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        actions.setClosing(true);
        setTimeout(() => {
          actions.close();
          actions.reset();
        }, 150);
        break;

      case 'Backspace':
        if (state.input === '') {
          const newStack = state.commandStack.slice(0, -1);
          actions.setCommandStack(newStack);
          const commands = commandProcessor.getAvailableCommands(newStack);
          actions.setAvailable(commands);
          actions.setInput('');
          actions.setCurrentArg(null);
        } else {
          handleInputUpdate(state.input.slice(0, -1));
        }
        break;

      case 'Enter':
        await handleEnter();
        break;

      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          const newInput = state.input + e.key;
          if (!state.currentArg) {
            const validationResult = validationStrategy.validate(
              newInput,
              state.available.map(cmd => cmd.name)
            );

            if (validationResult.isValid) {
              handleInputUpdate(newInput);
            } else {
              actions.setInputValidation(validationResult);
              setTimeout(() => {
                actions.setInputValidation({ isValid: true });
              }, 1000);
              return;
            }
          }
        }
        break;
    }
  }, [
    state.isOpen,
    state.commandStack,
    state.input,
    state.available,
    state.currentArg,
    validationStrategy,
    actions,
    commandProcessor,
    handleEnter
  ]);

  useEffect(() => {
    if (state.isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, state.isOpen]);

  return { handleKeyDown };
}