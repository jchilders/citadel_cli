import { useCallback } from 'react';
import { Command } from '../types/command';
import { CommandRegistry } from '../commandRegistry';

interface UseCitadelKeyboardProps {
  isOpen: boolean;
  commandStack: string[];
  input: string;
  available: Command[];
  currentArg: any;
  validationStrategy: any;
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
  isOpen,
  commandStack,
  input,
  available,
  currentArg,
  validationStrategy,
  commandRegistry,
  actions,
  commandProcessor
}: UseCitadelKeyboardProps) {
  const handleEnter = useCallback(async () => {
    const command = commandRegistry.getCommandByPath(commandStack);
    if (command?.args && currentArg) {
      if (input.trim()) {
        await commandProcessor.executeCommand(commandStack, [input]);
      }
    } else if (!command?.args && !currentArg) {
      await commandProcessor.executeCommand(commandStack, []);
    } 
  }, [commandStack, input, available, currentArg, commandRegistry, actions, commandProcessor]);

  // Helper function to handle input updates
  const handleInputUpdate = useCallback((newInput: string) => {
    actions.setInput(newInput);
    if (!currentArg) {
      commandProcessor.updateFilteredCommands(newInput, available, commandStack);
    }
  }, [actions, currentArg, commandProcessor, available, commandStack]);

  const handleKeyDown = useCallback(async (e: KeyboardEvent) => {
    if (!isOpen) {
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
        if (input === '') {
          const newStack = commandStack.slice(0, -1);
          actions.setCommandStack(newStack);
          const commands = commandProcessor.getAvailableCommands(newStack);
          actions.setAvailable(commands);
          actions.setInput('');
          actions.setCurrentArg(null);
        } else {
          handleInputUpdate(input.slice(0, -1));
        }
        break;

      case 'Enter':
        await handleEnter();
        break;

      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          const newInput = input + e.key;
          if (!currentArg) {
            const validationResult = validationStrategy.validate(
              newInput,
              available.map(cmd => cmd.name)
            );

            if (!validationResult.isValid) {
              actions.setInputValidation(validationResult);
              setTimeout(() => {
                actions.setInputValidation({ isValid: true });
              }, 1000);
              return;
            }
          }

          handleInputUpdate(newInput);
        }
        break;
    }
  }, [
    isOpen,
    commandStack,
    input,
    available,
    currentArg,
    validationStrategy,
    actions,
    commandProcessor,
    handleEnter
  ]);

  return { handleKeyDown };
}