import { useEffect } from 'react';
import { useCitadelKeyboard } from './useCitadelKeyboard';
import { CommandConfig, CommandItem } from '../types';

interface UseKeyboardHandlerProps {
  isOpen: boolean;
  isClosing: boolean;
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

export function useKeyboardHandler(props: UseKeyboardHandlerProps) {
  const { handleKeyDown } = useCitadelKeyboard(props);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
