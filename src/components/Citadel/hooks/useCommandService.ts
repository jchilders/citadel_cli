import { useState, useEffect, useCallback } from 'react';
import { CommandService } from '../services/CommandService';
import { CommandState } from '../types/command-state';
import { CommandDoc } from '../types/command-docs';
import { CommandResult } from '../types/command-results';

export function useCommandService(service: CommandService) {
  const [state, setState] = useState<CommandState>(service.getState());
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = service.onStateChange(newState => {
      setState(newState);
    });

    return unsubscribe;
  }, [service]);

  const executeCommand = useCallback(async (command: string): Promise<CommandResult> => {
    setIsExecuting(true);
    setError(undefined);

    try {
      const result = await service.executeCommand(command);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [service]);

  const searchDocs = useCallback((query: string): CommandDoc[] => {
    return service.searchDocs(query);
  }, [service]);

  const getDocs = useCallback((commandId: string): CommandDoc | undefined => {
    return service.getDocs(commandId);
  }, [service]);

  const undo = useCallback(async () => {
    if (state.canUndo) {
      await service.undo();
    }
  }, [service, state.canUndo]);

  const redo = useCallback(async () => {
    if (state.canRedo) {
      await service.redo();
    }
  }, [service, state.canRedo]);

  return {
    state,
    isExecuting,
    error,
    executeCommand,
    searchDocs,
    getDocs,
    undo,
    redo,
  };
}
