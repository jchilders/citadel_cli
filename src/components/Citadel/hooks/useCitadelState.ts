import { useState, useCallback, useEffect } from 'react';
import { CitadelState, CitadelActions, OutputItem } from '../types/state';
import { useCitadelConfig, useCitadelCommands, useCitadelStorage, useSegmentStack } from '../config/hooks';
import { CommandResult, ErrorCommandResult } from '../types/command-results';
import { useCommandHistory } from './useCommandHistory';
import { initializeHistoryService } from '../services/HistoryService';
import { Logger } from '../utils/logger';
import { useSegmentStackVersion } from './useSegmentStackVersion';

export const useCitadelState = () => {
  const config = useCitadelConfig();
  const commands = useCitadelCommands();
  const history = useCommandHistory();
  const segmentStack = useSegmentStack();
  const segmentStackVersion = useSegmentStackVersion();
  const storage = useCitadelStorage();

  const [state, setState] = useState<CitadelState>({
    currentInput: '',
    isEnteringArg: false,
    output: [],
    history: {
      commands: [],
      position: null,
      storage
    }
  });

  useEffect(() => {
    if (!storage) return;
    initializeHistoryService(storage);
  }, [storage]);

  // Keep state.history in sync with useCommandHistory
  useEffect(() => {
    setState(prev => ({
      ...prev,
      history: {
        commands: history.history.storedCommands,
        position: history.history.position,
        storage
      }
    }));
  }, [history.history, storage]);

  const actions: CitadelActions = {
    setCurrentInput: useCallback((input: string) => {
      Logger.debug("[CitadelActions] setCurrentInput: ", input);
      setState(prev => ({ ...prev, currentInput: input }));
    }, []),

    setIsEnteringArg: useCallback((isEntering: boolean) => {
      Logger.debug("[CitadelActions] setIsEnteringArg: ", isEntering);
      setState(prev => ({ ...prev, isEnteringArg: isEntering }));
    }, []),

    addOutput: useCallback((output: OutputItem) => {
      Logger.debug("[CitadelActions]addOutput: ", output);
      setState(prev => ({ 
        ...prev, 
        output: [...prev.output, output] 
      }));
    }, []),

    executeCommand: useCallback(async () => {
      const path = segmentStack.path();
      const command = commands.getCommand(path);
      if (!command) {
        console.error("[CitadelActions][executeCommand] Cannot execute command because no command was found for the given path: ", path);
        return;
      }

      const outputItem = new OutputItem(segmentStack);
      setState(prev => ({
        ...prev,
        output: [...prev.output, outputItem]
      }));

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timed out'));
          }, config.commandTimeoutMs);
        });

        const argVals = segmentStack.arguments.map(argSeg => argSeg.value || '');
        const result = await Promise.race([
          command.handler(argVals),
          timeoutPromise
        ]);

        if (!(result instanceof CommandResult)) {
          throw new Error(
            `The ${path.join('.')} command returned an invalid result type. Commands must return an instance of a CommandResult.\n` +
              'For example:\n   return new JsonCommandResult({ text: "Hello World" });\n' +
              `Check the definition of the ${path.join('.')} command and update the return type for its handler.`
          );
        }
        result.markSuccess();
        
        setState(prev => ({
          ...prev,
          output: prev.output.map(item => 
            item.timestamp === outputItem.timestamp ? { ...item, result } : item
          )
        }));
      } catch (error) {
        const result = new ErrorCommandResult(
          error instanceof Error ? error.message : 'Unknown error'
        );
        result.markFailure();

        setState(prev => ({
          ...prev,
          output: prev.output.map(item => 
            item.timestamp === outputItem.timestamp ? { ...item, result } : item
          )
        }));
      }
    }, [commands, config.commandTimeoutMs, segmentStackVersion]),

    clearHistory: useCallback(async () => {
      try {
        await history.clear();
      } catch (error) {
        console.warn('Failed to clear history:', error);
      }
    }, [history])
  };

  const getAvailableCommands_s = useCallback(() => {
    const completions = commands.getCompletions_s(segmentStack.path());
    return completions;
  }, [segmentStack, commands]);

  const getAvailableCommandSegments = useCallback(() => {
    return commands.getCompletions(segmentStack.path());
  }, [segmentStack, commands]);

  return { 
    state, 
    actions, 
    getAvailableCommands_s, 
    getAvailableCommandSegments 
  };
};
