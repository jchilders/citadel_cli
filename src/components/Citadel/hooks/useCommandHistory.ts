import { useState, useCallback, useEffect } from 'react';
import { StoredCommand } from '../types/storage';
import { useCitadelStorage } from '../config/CitadelConfigContext';
import { useSegmentStackVersion } from './useSegmentStackVersion';
import { CommandSegment } from '../types/command-trie';

export interface CommandHistory {
  storedCommands: StoredCommand[];
  position: number | null;
}

export interface CommandHistoryActions {
  addStoredCommand: (segments: CommandSegment[]) => Promise<void>;
  getStoredCommands: () => Promise<StoredCommand[]>;
  navigateHistory: (direction: 'up' | 'down', currentSegments: CommandSegment[]) => Promise<{
    segments: CommandSegment[] | null;
    position: number | null;
  }>;
  clear: () => Promise<void>;
}

export function createStoredCommand(segments: CommandSegment[]): StoredCommand {
  return {
    commandSegments: segments,
    timestamp: Date.now()
  };
}

export interface CommandHistoryHook {
  history: CommandHistory;
  addStoredCommand: (segments: CommandSegment[]) => Promise<void>;
  getStoredCommands: () => Promise<StoredCommand[]>;
  navigateHistory: (direction: 'up' | 'down', currentSegments: CommandSegment[]) => Promise<{
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
        storedCommands: [...prev.storedCommands, storedCommand],
        position: null
      }));
    } catch (error) {
      console.warn('Failed to save command to history:', error);
    }
  }, [storage]);

  const getStoredCommands = useCallback(async () => {
    if (!storage) return [];
    return await storage.getStoredCommands();
  }, [storage]);

  // Load command history from storage on mount
  useEffect(() => {
    if (!storage) return;

    const loadHistory = async () => {
      try {
        const storedCommands = await storage.getStoredCommands();
        setHistory(prev => ({
          ...prev,
          storedCommands: storedCommands
        }));
        return storedCommands;
      } catch (error) {
        console.warn('Failed to load command history:', error);
      }
    };
    loadHistory();
  }, [storage]);

  const navigateHistory = useCallback(async (direction: 'up' | 'down', currentSegments: CommandSegment[]): Promise<{ segments: CommandSegment[] | null; position: number | null }> => {
    console.log("[useCommandHistory][navigateHistory] direction: ", direction);
    const commands = await getStoredCommands();
    console.log("[useCommandHistory][navigateHistory] commands: ", commands);
    if (commands.length === 0) {
      return { segments: null, position: null };
    }

    console.log("[useCommandHistory][navigateHistory] 1");
    let newPosition: number | null = null;
    if (direction === 'up') {
      console.log("[useCommandHistory][navigateHistory][up] 1.1");
      if (history.position === null) {
        newPosition = history.storedCommands.length - 1;
      } else if (history.position > 0) {
        newPosition = history.position - 1;
      } else {
        newPosition = 0;
      }
    } else {
      console.log("[useCommandHistory][navigateHistory][down] 1.2");
      if (history.position === null || history.position >= history.storedCommands.length - 1) {
        newPosition = null;
      } else {
        newPosition = history.position + 1;
      }
    }

    console.log("[useCommandHistory][navigateHistory] 1.3");
    setHistory(prev => ({
      ...prev,
      position: newPosition
    }));

    // If we've returned to the original position or navigated down past the end, clear the input
    console.log("[useCommandHistory][navigateHistory] 1.4");
    if (newPosition === null) {
      return { 
        segments: [],
        position: null 
      };
    }

    // Otherwise return the historical command segments
    console.log("[useCommandHistory][navigateHistory] 1.5");
    let result = { 
      segments: newPosition !== null ? history.storedCommands[newPosition].commandSegments : null,
      position: newPosition 
    };
    console.log("[useCommandHistory][navigateHistory] 1.5 result: ", result);
    return result;
  }, [history, useSegmentStackVersion]);

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
