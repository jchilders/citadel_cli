import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';
import { useSlideAnimation } from './hooks/useSlideAnimation';
import { useCommandTrie } from './hooks/useCommandTrie';
import styles from './Citadel.module.css';
import { CommandInput } from './components/CommandInput';
import { CommandOutput } from './components/CommandOutput';
import { AvailableCommands } from './components/AvailableCommands';
import { CitadelState, CitadelActions, OutputItem } from './types/state';
import { CitadelConfig } from './config/types';
import { defaultConfig } from './config/defaults';
import { CitadelConfigProvider, useCitadelConfig } from './config/CitadelConfigContext';
import { ErrorCommandResult, BaseCommandResult } from './types/command-results';

export interface CitadelProps {
  config?: CitadelConfig;
  commands?: Record<string, any>;
}

const CitadelInner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const config = useCitadelConfig();
  const commandTrie = useCommandTrie();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      startHeightRef.current = containerRef.current.offsetHeight;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const delta = startYRef.current - e.clientY;
    const newHeight = Math.min(
      Math.max(startHeightRef.current + delta, 200),
      window.innerHeight * 0.8
    );
    
    setHeight(newHeight);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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
      const command = commandTrie.getCommand(path);
      if (!command || !command.isLeaf) return;

      // Add pending output immediately
      const outputItem = new OutputItem([...path, ...(args || [])]);
      actions.addOutput(outputItem);

      // Reset command line state
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

        if (!(result instanceof BaseCommandResult)) {
          throw new Error(
            'The ' + command.fullPath.join('.') + ' command returned an invalid result type. Commands must return an instance of a CommandResult.\n' +
            'For example:\n   return new JsonCommandResult({ text: "Hello World" });\n' +
            'Check the definition of the ' + command.fullPath.join('.') + ' command and update the return type.'
          );
        }

        result.markSuccess();

        // Update the output with the result
        setState(prev => ({
          ...prev,
          output: prev.output.map(item => 
            item.timestamp === outputItem.timestamp
              ? { ...item, result }
              : item
          )
        }));
      } catch (error) {
        // Create error result
        const result = new ErrorCommandResult(
          error instanceof Error ? error.message : 'Unknown error'
        );

        if (error instanceof Error && error.message === 'Request timed out') {
          result.markTimeout();
        }

        // Update the output with the error result
        setState(prev => ({
          ...prev,
          output: prev.output.map(item =>
            item.timestamp === outputItem.timestamp
              ? { ...item, result }
              : item
          )
        }));
      }
    }, [commandTrie, config])
  };

  // Toggle visibility with key from config or '.'
  useGlobalShortcut({
    onOpen: () => setIsVisible(true),
    onClose: () => setIsClosing(true),
    isVisible,
    showCitadelKey: config.showCitadelKey || '.'
  });

  // Handle animation completion
  const handleAnimationComplete = useCallback(() => {
    if (isClosing) {
      setIsVisible(false);
      setIsClosing(false);
    }
  }, [isClosing]);

  // Show/hide animation
  useSlideAnimation({
    isVisible,
    isClosing,
    onAnimationComplete: handleAnimationComplete
  });

  if (!isVisible) return null;

  const getAvailableCommands = () => {
    if (state.currentNode && state.currentNode.children) {
      return Array.from(state.currentNode.children.values());
    }
    return commandTrie.getRootCommands();
  };

  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${isVisible ? styles.slideUp : ''} ${isClosing ? styles.slideDown : ''}`}
      style={height ? { height: `${height}px` } : undefined}
      id="citadel-root"
    >
      <div className={styles.resizeHandle} onMouseDown={handleMouseDown} />
      <div className={styles.innerContainer}>
        <div className="flex-1 min-h-0 pt-3 px-4">
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
          />
        </div>
      </div>
    </div>
  );
};

export const Citadel: React.FC<CitadelProps> = ({ config = defaultConfig, commands }) => {
  return (
    <CitadelConfigProvider config={config} commands={commands}>
      <CitadelInner />
    </CitadelConfigProvider>
  );
};
