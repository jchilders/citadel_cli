import { useState, useCallback, useEffect } from 'react';
import { CitadelState, CitadelActions, OutputItem } from '../types/state';
import { useCommandTrie } from './useCommandTrie';
import { useCitadelConfig } from '../config/CitadelConfigContext';
import { CommandResult } from '../types/command-results';
import { ErrorCommandResult } from '../types/command-results';
import { useCommandHistory } from './useCommandHistory';
import { initializeHistoryService } from '../services/HistoryService';
import { StorageFactory } from '../storage/StorageFactory';

export const useCitadelState = () => {
  const commandTrie = useCommandTrie();
  const config = useCitadelConfig();
  const [history, historyActions] = useCommandHistory();

  const [state, setState] = useState<CitadelState>({
    commandStack: [],
    currentInput: '',
    isEnteringArg: false,
    currentNode: undefined,
    output: [],
    validation: { isValid: true },
    history
  });

  // Initialize history service
  useEffect(() => {
    const storage = StorageFactory.getInstance().getStorage(config.storage);
    initializeHistoryService(storage);
  }, [config.storage]);

  // Keep state.history in sync with useCommandHistory
  useEffect(() => {
    setState(prev => ({
      ...prev,
      history
    }));
  }, [history]);

  const executeCommand = useCallback(async (path: string[], args?: string[]) => {
    const command = commandTrie.getCommand(path);
    if (!command || !command.isLeaf) return;

    const outputItem = new OutputItem([...path, ...(args || [])]);
    setState(prev => ({
      ...prev,
      output: [...prev.output, outputItem]
    }));

    setState(prev => ({
      ...prev,
      commandStack: [],
      currentInput: '',
      isEnteringArg: false,
      currentNode: undefined,
      validation: { isValid: true }
    }));

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timed out'));
        }, config.commandTimeoutMs);
      });

      const result = await Promise.race([
        command.handler(args || []),
        timeoutPromise
      ]);

      if (!(result instanceof CommandResult)) {
        throw new Error(
          `The ${command.fullPath.join('.')} command returned an invalid result type. Commands must return an instance of a CommandResult.\n` +
          'For example:\n   return new JsonCommandResult({ text: "Hello World" });\n' +
          `Check the definition of the ${command.fullPath.join('.')} command and update the return type.`
        );
      }

      result.markSuccess();

      // Save successful command to history
      const storedCommand = {
        command: [...path, ...(args || [])],
        timestamp: Date.now()
      };

      try {
        await historyActions.addCommand(storedCommand);
        setState(prev => ({
          ...prev,
          output: prev.output.map(item => 
            item.timestamp === outputItem.timestamp
              ? { ...item, result }
              : item
          )
        }));
      } catch (error) {
        console.warn('Failed to save command to history:', error);
        setState(prev => ({
          ...prev,
          output: prev.output.map(item => 
            item.timestamp === outputItem.timestamp
              ? { ...item, result }
              : item
          )
        }));
      }
    } catch (error) {
      const result = new ErrorCommandResult(
        error instanceof Error ? error.message : 'Unknown error'
      );
      result.markSuccess();

      setState(prev => ({
        ...prev,
        output: prev.output.map(item => 
          item.timestamp === outputItem.timestamp
            ? { ...item, result }
            : item
        )
      }));
    }
  }, [commandTrie, config.commandTimeoutMs, historyActions, state]);

  const actions: CitadelActions = {
    setCommandStack: useCallback((stack: string[]) => {
      setState(prev => ({ 
        ...prev, 
        commandStack: stack,
        currentNode: commandTrie.getCommand(stack)
      }));
    }, [commandTrie]),

    setCurrentInput: useCallback((input: string) => {
      setState(prev => ({ ...prev, currentInput: input }));
    }, []),

    setIsEnteringArg: useCallback((isEntering: boolean) => {
      setState(prev => ({ ...prev, isEnteringArg: isEntering }));
    }, []),

    setCurrentNode: useCallback((node) => {
      setState(prev => ({ ...prev, currentNode: node }));
    }, []),

    addOutput: useCallback((output: OutputItem) => {
      setState(prev => ({ 
        ...prev, 
        output: [...prev.output, output] 
      }));
    }, []),

    setValidation: useCallback((validation: { isValid: boolean; message?: string }) => {
      setState(prev => ({ ...prev, validation }));
    }, []),

    executeCommand,

    executeHistoryCommand: useCallback(async (index: number) => {
      const commands = historyActions.getCommands();
      const command = commands[index];
      if (!command) {
        console.warn(`No command found at history index ${index}`);
        return;
      }

      // Split command array into path and args
      // The last element is the argument (if any)
      const path = command.command.slice(0, -1);
      const args = command.command.length > 0 ? [command.command[command.command.length - 1]] : undefined;

      await executeCommand(path, args);
    }, [historyActions, executeCommand])
  };

  const getAvailableCommands = useCallback(() => {
    if (state.currentNode && state.currentNode.children) {
      return Array.from(state.currentNode.children.values());
    }
    return commandTrie.getRootCommands();
  }, [state.currentNode, commandTrie]);

  return { state, actions, getAvailableCommands };
};
