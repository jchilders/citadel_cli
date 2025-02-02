import { useState, useCallback, useEffect } from 'react';
import { CitadelState, CitadelActions, OutputItem } from '../types/state';
import { useCitadelConfig, useCitadelCommands, useCitadelStorage } from '../config/CitadelConfigContext';
import { CommandResult } from '../types/command-results';
import { ErrorCommandResult } from '../types/command-results';
import { useCommandHistory } from './useCommandHistory';
import { useCommandParser } from './useCommandParser';
import { initializeHistoryService } from '../services/HistoryService';
import { ArgumentSegment } from '../types/command-trie';
import { Logger } from '../utils/logger';

export const useCitadelState = () => {
  const config = useCitadelConfig();
  const commandTrie = useCitadelCommands();
  const [history, historyActions] = useCommandHistory();
  const { replayCommand } = useCommandParser({ commands: commandTrie });

  const [state, setState] = useState<CitadelState>({
    commandStack: [],
    currentInput: '',
    isEnteringArg: false,
    currentNode: undefined,
    currentSegmentIndex: 0,
    output: [],
    validation: { isValid: true },
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

  const executeCommand = useCallback(async (path: string[], args?: string[]) => {
    const node = commandTrie.getCommand(path);

    if (!node) {
      throw new Error(`Command not found: ${path.join(' ')}`);
    }

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
        inputs: [...node.fullPath, ...(args || [])],
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
      console.warn('Command failed:', error);
      const result = new ErrorCommandResult(
        error instanceof Error ? error.message : 'Unknown error'
      );
      result.markFailure();

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
        const { command: upCommand } = historyActions.navigateHistory('up', state.currentInput);
        if (upCommand) {
          replayCommand(upCommand, state, actions);
        }
        break;

      case 'ArrowDown':
        event.preventDefault();
        const { command: downCommand } = historyActions.navigateHistory('down', state.currentInput);
        if (downCommand) {
          replayCommand(downCommand, state, actions);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (state.history.position !== null) {
          const command = state.history.commands[state.history.position];
          executeCommand([...command.inputs]);
          setState(prev => ({
            ...prev,
            history: {
              ...prev.history,
              position: null,
              savedInput: null
            }
          }));
        }
        break;

      case 'Escape':
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
  }, [state.currentInput, state.history, historyActions, executeCommand]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const actions: CitadelActions = {
    setCommandStack: useCallback((stack: string[]) => {
      Logger.debug("setCommandStack: ", stack);

      setState(prev => ({ 
        ...prev, 
        commandStack: stack,
        currentNode: commandTrie.getCommand(stack)
      }));
    }, [commandTrie]),

    setCurrentInput: useCallback((input: string) => {
      Logger.debug("setCurrentInput: ", input);
      setState(prev => ({ ...prev, currentInput: input }));
    }, []),

    setIsEnteringArg: useCallback((isEntering: boolean) => {
      Logger.debug("setIsEnteringArg: ", isEntering);
      setState(prev => ({ ...prev, isEnteringArg: isEntering }));
    }, []),

    setCurrentSegmentIndex: useCallback((segmentIndex: number) => {
      Logger.debug("setCurrentSegmentIndex: ", segmentIndex);
      setState(prev => ({ ...prev, currentSegmentIndex: segmentIndex }));
    }, []),

    setCurrentNode: useCallback((node) => {
      Logger.debug("setCurrentNode: ", node);
      setState(prev => ({ ...prev, currentNode: node }));
    }, []),

    addOutput: useCallback((output: OutputItem) => {
      Logger.debug("addOutput: ", output);
      setState(prev => ({ 
        ...prev, 
        output: [...prev.output, output] 
      }));
    }, []),

    setValidation: useCallback((validation: { isValid: boolean; message?: string }) => {
      setState(prev => ({ ...prev, validation }));
    }, []),

    executeCommand: useCallback(async (path: string[], args?: ArgumentSegment[]) => {
      const node = commandTrie.getCommand(path);
      if (!node) return;

      const outputItem = new OutputItem([...path, ...(args || [])]);
      setState(prev => ({
        ...prev,
        output: [...prev.output, outputItem]
      }));

      try {
        const stringArgs = args?.map(arg => arg.toString()) || [];
        
        const result = await Promise.race([
          node.handler(stringArgs),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Command timed out')), config.commandTimeoutMs);
          })
        ]);

        result.markSuccess();
        
        // Save successful command to history
        await historyActions.addCommand({
          inputs: [...path, ...(args || [])],
          timestamp: Date.now()
        });

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
    }, [commandTrie, config.commandTimeoutMs, historyActions]),

    executeHistoryCommand: useCallback(async (index: number) => {
      const commands = state.history.commands;
      const command = commands[index];
      if (!command) {
        console.warn(`No command found at history index ${index}`);
        return;
      }

      await replayCommand(command, state, actions);
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
    Logger.debug("state.commandStack", state.commandStack);
    const completions = commandTrie.getCompletions_s(state.commandStack);
    Logger.debug("getAvailableCommands completions: ", completions);
    return completions;
  }, [state.commandStack, commandTrie]);

  return { state, actions, getAvailableCommands };
};
