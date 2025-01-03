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
    const node = commandTrie.getCommand(path);
    if (!node || !node.isLeaf) return;

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
        node.handler(args || []),
        timeoutPromise
      ]);

      if (!(result instanceof CommandResult)) {
        throw new Error(
          `The ${node.fullPath.join('.')} command returned an invalid result type. Commands must return an instance of a CommandResult.\n` +
          'For example:\n   return new JsonCommandResult({ text: "Hello World" });\n' +
          `Check the definition of the ${node.fullPath.join('.')} command and update the return type.`
        );
      }

      result.markSuccess();

      // Save successful command to history
      const storedCommand = {
        node,
        args: args || [],
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

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key } = event;

    switch (key) {
      case 'ArrowUp':
        event.preventDefault();
        const upResult = historyActions.navigateHistory('up', state.currentInput);
        setState(prev => ({
          ...prev,
          currentInput: upResult.newInput
        }));
        break;

      case 'ArrowDown':
        event.preventDefault();
        const downResult = historyActions.navigateHistory('down', state.currentInput);
        setState(prev => ({
          ...prev,
          currentInput: downResult.newInput
        }));
        break;

      case 'Enter':
        event.preventDefault();
        if (state.history.position !== null) {
          const command = state.history.commands[state.history.position];
          executeCommand(command.node.fullPath, command.args);
        }
        break;

      case 'Escape':
        event.preventDefault();
        if (state.history.position !== null) {
          const savedInput = state.history.savedInput || '';
          setState(prev => ({
            ...prev,
            currentInput: savedInput,
            history: {
              ...prev.history,
              position: null,
              savedInput: null
            }
          }));
        }
        break;
    }
  }, [state.currentInput, state.history, historyActions, executeCommand]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
      const commands = state.history.commands;
      const command = commands[index];
      if (!command) {
        console.warn(`No command found at history index ${index}`);
        return;
      }

      await executeCommand(command.node.fullPath, command.args);
    }, [state.history.commands, executeCommand]),

    clearHistory: useCallback(async () => {
      try {
        await historyActions.clear();
      } catch (error) {
        console.warn('Failed to clear history:', error);
      }
    }, [historyActions])
  };

  const getAvailableCommands = useCallback(() => {
    if (state.currentNode && state.currentNode.children) {
      return Array.from(state.currentNode.children.values());
    }
    return commandTrie.getRootCommands();
  }, [state.currentNode, commandTrie]);

  return { state, actions, getAvailableCommands };
};
