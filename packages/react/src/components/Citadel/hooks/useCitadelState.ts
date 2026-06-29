import { useState, useCallback, useEffect, useRef } from 'react';
import { CitadelState, CitadelActions, OutputItem } from '../types/state';
import { ArgumentSegment } from '@citadel_cli/core';
import { useCitadelConfig, useCitadelCommands, useCitadelStorage, useSegmentStack } from '../config/hooks';
import { CommandResult, ErrorCommandResult, StreamCommandResult } from '@citadel_cli/core';
import { useCommandHistory } from './useCommandHistory';
import { initializeHistoryService } from '../services/HistoryService';
import { Logger } from '@citadel_cli/core';

export const useCitadelState = () => {
  const config = useCitadelConfig();
  const commands = useCitadelCommands();
  const history = useCommandHistory();
  const segmentStack = useSegmentStack();
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

  // Live streams (tail -f) still running. Cancelled on unmount so their
  // producers (intervals, sockets) don't leak.
  const activeStreams = useRef<Set<StreamCommandResult>>(new Set());
  useEffect(() => {
    const streams = activeStreams.current;
    return () => {
      streams.forEach((s) => s.cancel());
      streams.clear();
    };
  }, []);

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

        // Fill in declared defaults for omitted trailing optional arguments.
        const declaredArgs = command.segments.filter(
          (seg): seg is ArgumentSegment => seg.type === 'argument'
        );
        for (let i = argVals.length; i < declaredArgs.length; i++) {
          const { defaultValue } = declaredArgs[i];
          if (defaultValue === undefined) break;
          argVals.push(defaultValue);
        }

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

        if (result instanceof StreamCommandResult) {
          // A live stream (tail -f): attach it, re-render on every push/end, and
          // leave it running until it closes or is cancelled (not timed out).
          // A fresh output array each bump lets CommandOutput auto-scroll.
          outputItem.result = result;
          activeStreams.current.add(result);
          result.subscribe(() => {
            setState(prev => ({ ...prev, output: [...prev.output] }));
            if (result.ended) activeStreams.current.delete(result);
          });
          result.start();
          setState(prev => ({ ...prev, output: [...prev.output] }));
          return;
        }

        result.markSuccess();

        setState(prev => ({
          ...prev,
          output: prev.output.map(item =>
            item.id === outputItem.id ? { ...item, result } : item
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
            item.id === outputItem.id ? { ...item, result } : item
          )
        }));
      }
    }, [commands, config.commandTimeoutMs, segmentStack]),

    clearHistory: useCallback(async () => {
      try {
        await history.clear();
      } catch (error) {
        console.warn('Failed to clear history:', error);
      }
    }, [history])
  };

  return { state, actions };
};
