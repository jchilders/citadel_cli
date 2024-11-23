import { useEffect } from 'react';
import { useCitadelKeyboard } from './useCitadelKeyboard';
import { Command } from '../types/command';

interface UseKeyboardHandlerProps {
  isOpen: boolean;
  isClosing: boolean;
  commandStack: string[];
  input: string;
  available: Command[];
  currentArg: any;
  validationStrategy: any;
  commands: Command[];
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

export function useKeyboardHandler(props: UseKeyboardHandlerProps) {
  const { handleKeyDown } = useCitadelKeyboard(props);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
