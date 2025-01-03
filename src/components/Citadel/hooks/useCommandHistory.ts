import { useState, useCallback, useEffect } from 'react';
import { StorageFactory } from '../storage/StorageFactory';
import { StoredCommand } from '../types/storage';
import { useCitadelConfig } from '../config/CitadelConfigContext';

interface CommandHistory {
  commands: StoredCommand[];
  position: number | null;
  savedInput: string | null;
}

interface CommandHistoryActions {
  addCommand: (command: StoredCommand) => Promise<void>;
  getCommands: () => StoredCommand[];
  navigateHistory: (direction: 'up' | 'down', currentInput: string) => { newInput: string; position: number | null };
  saveInput: (input: string) => void;
  clear: () => Promise<void>;
}

export function useCommandHistory(): [CommandHistory, CommandHistoryActions] {
  const config = useCitadelConfig();
  const storage = StorageFactory.getInstance().getStorage(config.storage);

  const [history, setHistory] = useState<CommandHistory>({
    commands: [],
    position: null,
    savedInput: null
  });

  // Load command history from storage on mount
  useEffect(() => {
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

  const navigateHistory = useCallback((direction: 'up' | 'down', currentInput: string): { newInput: string; position: number | null } => {
    if (history.commands.length === 0) {
      return { newInput: currentInput, position: null };
    }

    // Save current input when starting history navigation
    if (history.position === null && direction === 'up') {
      setHistory(prev => ({
        ...prev,
        savedInput: currentInput
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

    // If we've returned to the original position, restore the saved input
    if (newPosition === null) {
      const savedInput = history.savedInput || '';
      setHistory(prev => ({
        ...prev,
        savedInput: null
      }));
      return { newInput: savedInput, position: null };
    }

    // Otherwise return the historical command
    const historicalCommand = history.commands[newPosition].command.join(' ');
    return { newInput: historicalCommand, position: newPosition };
  }, [history]);

  const saveInput = useCallback((input: string) => {
    setHistory(prev => ({
      ...prev,
      savedInput: input
    }));
  }, []);

  const clear = useCallback(async () => {
    try {
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
