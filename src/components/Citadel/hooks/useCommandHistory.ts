import { useState, useCallback, useEffect } from 'react';
import { StoredCommand } from '../types/storage';
import { useCitadelStorage } from '../config/hooks';
import { CommandSegment, cloneCommandSegments } from '../types/command-registry';

export interface CommandHistory {
  storedCommands: StoredCommand[];
  position: number | null;
}

export interface CommandHistoryActions {
  addStoredCommand: (segments: CommandSegment[]) => Promise<void>;
  getStoredCommands: () => Promise<StoredCommand[]>;
  navigateHistory: (direction: 'up' | 'down') => Promise<{
    segments: CommandSegment[] | null;
    position: number | null;
  }>;
  clear: () => Promise<void>;
}

export function createStoredCommand(segments: CommandSegment[]): StoredCommand {
  return {
    commandSegments: cloneCommandSegments(segments),
    timestamp: Date.now()
  };
}

export interface CommandHistoryHook {
  history: CommandHistory;
  addStoredCommand: (segments: CommandSegment[]) => Promise<void>;
  getStoredCommands: () => Promise<StoredCommand[]>;
  navigateHistory: (direction: 'up' | 'down') => Promise<{
    segments: CommandSegment[] | null;
    position: number | null;
  }>;
  clear: () => Promise<void>;
}

export function useCommandHistory(): CommandHistoryHook {
  const storage = useCitadelStorage();

  const [history, setHistory] = useState<CommandHistory>({
    storedCommands: [],
    position: null
  });

  const addStoredCommand = useCallback(async (segments: CommandSegment[]) => {
    if (!storage) return;

    try {
      const storedCommand = createStoredCommand(segments);
      await storage.addStoredCommand(storedCommand);
      setHistory(prev => ({
        ...prev,
        storedCommands: [...prev.storedCommands, {
          ...storedCommand,
          commandSegments: cloneCommandSegments(storedCommand.commandSegments),
        }],
        position: null
      }));
    } catch (error) {
      console.warn('Failed to save command to history:', error);
    }
  }, [storage]);

  const getStoredCommands = useCallback(async () => {
    if (!storage) return [];
    const storedCommands = await storage.getStoredCommands();
    return storedCommands.map((storedCommand) => ({
      ...storedCommand,
      commandSegments: cloneCommandSegments(storedCommand.commandSegments),
    }));
  }, [storage]);

  // Load command history from storage on mount
  useEffect(() => {
    if (!storage) return;

    const loadHistory = async () => {
      try {
        const storedCommands = await storage.getStoredCommands();
        const clonedStoredCommands = storedCommands.map((storedCommand) => ({
          ...storedCommand,
          commandSegments: cloneCommandSegments(storedCommand.commandSegments),
        }));
        setHistory(prev => ({
          ...prev,
          storedCommands: clonedStoredCommands
        }));
        return clonedStoredCommands;
      } catch (error) {
        console.warn('Failed to load command history:', error);
      }
    };
    loadHistory();
  }, [storage]);

  const navigateHistory = useCallback(async (direction: 'up' | 'down'): Promise<{ segments: CommandSegment[] | null; position: number | null }> => {
    const commands = await getStoredCommands();
    if (commands.length === 0) {
      setHistory(prev => ({
        ...prev,
        storedCommands: [],
        position: null
      }));
      return { segments: null, position: null };
    }

    let newPosition: number | null = null;
    if (direction === 'up') {
      if (history.position === null) {
        newPosition = commands.length - 1;
      } else if (history.position > 0) {
        newPosition = history.position - 1;
      } else {
        newPosition = 0;
      }
    } else {
      if (history.position === null || history.position >= commands.length - 1) {
        newPosition = null;
      } else {
        newPosition = history.position + 1;
      }
    }

    setHistory(prev => ({
      ...prev,
      storedCommands: commands.map((storedCommand) => ({
        ...storedCommand,
        commandSegments: cloneCommandSegments(storedCommand.commandSegments),
      })),
      position: newPosition
    }));

    if (newPosition === null) {
      return {
        segments: [],
        position: null
      };
    }

    const selectedCommand = commands[newPosition];
    if (!selectedCommand) {
      return {
        segments: [],
        position: null
      };
    }

    return {
      segments: cloneCommandSegments(selectedCommand.commandSegments),
      position: newPosition
    };
  }, [history.position, getStoredCommands]);

  const clear = useCallback(async () => {
    try {
      if (!storage) return;

      await storage.clear();
      setHistory({
        storedCommands: [],
        position: null
      });
    } catch (error) {
      console.warn('Failed to clear command history:', error);
    }
  }, [storage]);

  return {
    history,
    addStoredCommand,
    getStoredCommands,
    navigateHistory,
    clear
  };
}
