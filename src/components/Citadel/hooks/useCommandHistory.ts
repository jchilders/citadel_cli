import { useState, useCallback, useEffect } from 'react';
import { StoredCommand } from '../types/storage';
import { useCitadelStorage } from '../config/CitadelConfigContext';

export interface CommandHistory {
  commands: StoredCommand[];
  position: number | null;
  savedInput: string | null;
}

export interface CommandHistoryActions {
  addCommand: (command: StoredCommand) => Promise<void>;
  getCommands: () => StoredCommand[];
  navigateHistory: (direction: 'up' | 'down', currentInput: string) => {
    command: StoredCommand | null;
    position: number | null;
  };
  saveInput: (input: string) => void;
  clear: () => Promise<void>;
}

export function useCommandHistory(): [CommandHistory, CommandHistoryActions] {
  const storage = useCitadelStorage();

  const [history, setHistory] = useState<CommandHistory>({
    commands: [],
    position: null,
    savedInput: null
  });

  // Load command history from storage on mount
  useEffect(() => {
    if (!storage) return;

    const loadHistory = async () => {
      try {
        const commands = await storage.getCommands();
        setHistory(prev => ({
          ...prev,
          commands
        }));
      } catch (error) {
        console.warn('Failed to load command history:', error);
      }
    };
    loadHistory();
  }, [storage]);

  const addCommand = useCallback(async (command: StoredCommand) => {
    if (!storage) return;

    try {
      await storage.addCommand(command);
      setHistory(prev => ({
        ...prev,
        commands: [...prev.commands, command],
        position: null,
        savedInput: null
      }));
    } catch (error) {
      console.warn('Failed to save command to history:', error);
    }
  }, [storage]);

  const getCommands = useCallback(() => {
    return history.commands;
  }, [history.commands]);

  const navigateHistory = useCallback((direction: 'up' | 'down', currentInput: string): { command: StoredCommand | null; position: number | null } => {
    if (history.commands.length === 0) {
      return { command: null, position: null };
    }

    // Save current input when starting history navigation
    if (history.position === null && direction === 'up') {
      const currentCommand: StoredCommand = {
        inputs: currentInput.split(' ').filter(Boolean),
        timestamp: Date.now()
      };
      setHistory(prev => ({
        ...prev,
        savedInput: JSON.stringify(currentCommand)
      }));
    }

    let newPosition: number | null = null;
    if (direction === 'up') {
      if (history.position === null) {
        newPosition = history.commands.length - 1;
      } else if (history.position > 0) {
        newPosition = history.position - 1;
      } else {
        newPosition = 0;
      }
    } else {
      if (history.position === null || history.position >= history.commands.length - 1) {
        newPosition = null;
      } else {
        newPosition = history.position + 1;
      }
    }

    setHistory(prev => ({
      ...prev,
      position: newPosition
    }));

    // If we've returned to the original position, return saved input command
    if (newPosition === null && history.savedInput) {
      const savedCommand: StoredCommand = JSON.parse(history.savedInput);
      setHistory(prev => ({
        ...prev,
        savedInput: null
      }));
      return { command: savedCommand, position: null };
    }

    // Otherwise return the historical command
    return { 
      command: newPosition !== null ? history.commands[newPosition] : null,
      position: newPosition 
    };
  }, [history]);

  const saveInput = useCallback((input: string) => {
    setHistory(prev => ({
      ...prev,
      savedInput: input
    }));
  }, []);

  const clear = useCallback(async () => {
    try {
      if (!storage) return;

      await storage.clear();
      setHistory({
        commands: [],
        position: null,
        savedInput: null
      });
    } catch (error) {
      console.warn('Failed to clear command history:', error);
    }
  }, [storage]);

  const actions: CommandHistoryActions = {
    addCommand,
    getCommands,
    navigateHistory,
    saveInput,
    clear
  };

  return [history, actions];
}
