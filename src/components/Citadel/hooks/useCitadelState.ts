import { useState, useCallback, useEffect } from 'react';
import { CitadelState, CitadelActions, OutputItem } from '../types/state';
import { useCitadelConfig, useCitadelCommands, useCitadelStorage, useSegmentStack } from '../config/CitadelConfigContext';
import { CommandResult, ErrorCommandResult } from '../types/command-results';
import { useCommandHistory } from './useCommandHistory';
import { initializeHistoryService } from '../services/HistoryService';
import { Logger } from '../utils/logger';

export const useCitadelState = () => {
  const config = useCitadelConfig();
  const segmentStack = useSegmentStack();
  const commands = useCitadelCommands();
  const [history, historyActions] = useCommandHistory();
  // const { replayCommand } = useCommandParser({ commands: commandTrie });

  const [state, setState] = useState<CitadelState>({
    currentInput: '',
    isEnteringArg: false,
    output: [],
    history
  });

  // Initialize history service
  const storage = useCitadelStorage();
  useEffect(() => {
    if (!storage) return;
    initializeHistoryService(storage);
  }, [storage]);

  // Keep state.history in sync with useCommandHistory
  useEffect(() => {
    setState(prev => ({
      ...prev,
      history
    }));
  }, [history]);


  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    console.log("[useCitadelState][handleKeyDown]");
    const { key } = event;

    switch (key) {
      case 'ArrowUp':
        console.log("[useCitadelState][handleKeyDown][ArrowUp]");
        event.preventDefault();
        const { command: upCommand } = historyActions.navigateHistory('up', state.currentInput);
        if (upCommand) {
          replayCommand(upCommand, state, actions);
        }
        break;

      case 'ArrowDown':
        console.log("[useCitadelState][handleKeyDown][ArrowDown]");
        event.preventDefault();
        const { command: downCommand } = historyActions.navigateHistory('down', state.currentInput);
        if (downCommand) {
          replayCommand(downCommand, state, actions);
        }
        break;

      case 'Escape':
        console.log("[useCitadelState][handleKeyDown][Escape]");
        event.preventDefault();
        if (state.history.position !== null) {
          const savedInput = state.history.savedInput || '';
          setState(prev => ({
            ...prev,
            currentInput: typeof savedInput === 'string' ? savedInput : savedInput?.inputs.join(' ') ?? '',
            history: {
              ...prev.history,
              position: null,
              savedInput: null
            }
          }));
        }
        break;
    }
  }, [state.currentInput, state.history, historyActions ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
      console.log(`[CitadelActions][executeCommand] path: {path}`)
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
        const argVals = segmentStack.arguments.map(argSeg => argSeg.value);
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timed out'));
          }, config.commandTimeoutMs);
        });

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
        
        // Save successful command to history
        // await historyActions.addCommand({
        //   inputs: [...path, ...(args || [])],
        //   timestamp: Date.now()
        // });

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
    }, [commands, config.commandTimeoutMs, historyActions]),

    executeHistoryCommand: useCallback(async (index: number) => {
      const commands = state.history.commands;
      const command = commands[index];
      if (!command) {
        console.warn(`No command found at history index ${index}`);
        return;
      }

      await replayCommand(command, state, actions);
    }, [state.history.commands ]),

    clearHistory: useCallback(async () => {
      try {
        await historyActions.clear();
      } catch (error) {
        console.warn('Failed to clear history:', error);
      }
    }, [historyActions])
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
