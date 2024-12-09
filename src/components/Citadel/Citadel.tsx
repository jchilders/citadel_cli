import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';
import { useSlideAnimation } from './hooks/useSlideAnimation';
import styles from './Citadel.module.css';
import { CommandInput } from './components/CommandInput';
import { CommandOutput } from './components/CommandOutput';
import { AvailableCommands } from './components/AvailableCommands';
import { CommandTrie } from './types/command-trie';
import { CitadelState, CitadelActions, OutputItem } from './types/state';
import { CitadelConfig } from './config/types';
import { defaultConfig } from './config/defaults';
import { initializeCommands } from './commands-config';

export const Citadel: React.FC<{ config?: CitadelConfig }> = ({ config = defaultConfig }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const mergedConfig = {
    ...defaultConfig,
    ...config,
    showCitadelKey: config.showCitadelKey || '.'
  };

  // Initialize command trie with the merged config
  const commandTrie = useMemo(() => {
    const trie = new CommandTrie(mergedConfig);
    initializeCommands(trie);
    return trie;
  }, [mergedConfig.includeHelpCommand]);

  const [state, setState] = useState<CitadelState>({
    commandStack: [],
    currentInput: '',
    isEnteringArg: false,
    currentNode: undefined,
    output: [],
    validation: { isValid: true }
  });

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

    executeCommand: useCallback(async (path: string[], args?: string[]) => {
      const node = commandTrie.getCommand(path);
      if (!node?.handler) {
        actions.setValidation({
          isValid: false,
          message: 'Invalid command or missing handler'
        });
        return;
      }

      try {
        const result = await node.handler(args || []);
        actions.addOutput({
          command: path,
          result,
          timestamp: Date.now()
        });
        actions.setValidation({ isValid: true });
        // Reset all command-related state
        setState(prev => ({
          ...prev,
          commandStack: [],
          currentInput: '',
          isEnteringArg: false,
          currentNode: undefined,
          validation: { isValid: true }
        }));
      } catch (error) {
        actions.addOutput({
          command: path,
          result: { text: 'Command failed' },
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }, [commandTrie])
  };

  // Toggle visibility with keyboard shortcut
  useGlobalShortcut({
    onOpen: () => setIsVisible(true),
    onClose: () => setIsClosing(true),
    isVisible,
    showCitadelKey: mergedConfig.showCitadelKey
  });

  // Handle animation completion
  const handleAnimationComplete = useCallback(() => {
    if (isClosing) {
      setIsVisible(false);
      setIsClosing(false);
    }
  }, [isClosing]);

  // Animation styles
  const { style, animationClass } = useSlideAnimation({
    isVisible,
    isClosing,
    onAnimationComplete: handleAnimationComplete
  });

  if (!isVisible) return null;

  const getAvailableCommands = () => {
    if (state.currentNode?.children) {
      return Array.from(state.currentNode.children.values());
    }
    return commandTrie.getRootCommands();
  };

  return (
    <div className={`${styles.container} ${animationClass}`} style={style} id="citadel-root">
      <div className="flex-1 min-h-0 pt-3 px-2">
        <CommandOutput output={state.output} outputRef={outputRef} />
      </div>
      <div className="flex-shrink-0">
        <CommandInput
          state={state}
          actions={actions}
          availableCommands={getAvailableCommands()}
          commandTrie={commandTrie}
        />
        <AvailableCommands
          state={state}
          availableCommands={getAvailableCommands()}
          config={mergedConfig}
        />
      </div>
    </div>
  );
};
