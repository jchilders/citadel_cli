import { useCallback } from 'react';
import { CommandConfig, CommandItem } from '../types';

interface UseCitadelKeyboardProps {
  isOpen: boolean;
  commandStack: string[];
  input: string;
  available: CommandItem[];
  currentArg: any;
  validationStrategy: any;
  commands: CommandConfig;
  actions: {
    open: () => void;
    setClosing: (closing: boolean) => void;
    close: () => void;
    reset: () => void;
    setCommandStack: (stack: string[]) => void;
    setInput: (input: string) => void;
    setCurrentArg: (arg: any) => void;
    setAvailable: (available: CommandItem[]) => void;
    setInputValidation: (validation: { isValid: boolean; message?: string }) => void;
  };
  commandProcessor: {
    getAvailableCommands: (stack: string[]) => CommandItem[];
    getCommandFromStack: (stack: string[], commands: CommandConfig) => any;
    executeCommand: (stack: string[], args?: string[]) => Promise<void>;
    updateFilteredCommands: (input: string, available: CommandItem[], stack: string[]) => void;
  };
}

export function useCitadelKeyboard({
  isOpen,
  commandStack,
  input,
  available,
  currentArg,
  validationStrategy,
  commands,
  actions,
  commandProcessor
}: UseCitadelKeyboardProps) {
  const handleEnter = useCallback(async () => {
    if (currentArg) {
      if (input.trim()) {
        await commandProcessor.executeCommand(commandStack, [input]);
      }
    } else if (available.length === 1) {
      const selectedCommand = available[0];
      const newStack = [...commandStack, selectedCommand.name];
      actions.setCommandStack(newStack);
      const command = commandProcessor.getCommandFromStack(newStack, commands);

      if (command?.args?.length) {
        actions.setCurrentArg(command.args[0]);
        actions.setInput('');
        actions.setAvailable([]);
      } else if (command?.subcommands) {
        const nextCommands = commandProcessor.getAvailableCommands(newStack);
        actions.setInput('');
        actions.setAvailable(nextCommands);
      } else if (command?.handler) {
        await commandProcessor.executeCommand(commandStack);
      }
    } else if (commandStack.length > 0) {
      const command = commandProcessor.getCommandFromStack(commandStack, commands);
      if (command?.handler && !command.args?.length) {
        await commandProcessor.executeCommand(commandStack);
      } else if (command?.subcommands) {
        const nextCommands = commandProcessor.getAvailableCommands(commandStack);
        actions.setInput('');
        actions.setAvailable(nextCommands);
      }
    }
  }, [commandStack, input, available, currentArg, commands, actions, commandProcessor]);

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
          const newInput = input.slice(0, -1);
          actions.setInput(newInput);
          if (!currentArg) {
            commandProcessor.updateFilteredCommands(newInput, available, commandStack);
          }
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

          actions.setInput(newInput);
          if (!currentArg) {
            commandProcessor.updateFilteredCommands(newInput, available, commandStack);
          }
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