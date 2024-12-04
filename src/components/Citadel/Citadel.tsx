import React, { useState, useCallback, useRef } from 'react';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';
import { useSlideAnimation } from './hooks/useSlideAnimation';
import styles from './Citadel.module.css';
import { CommandInput } from './components/CommandInput';
import { CommandOutput } from './components/CommandOutput';
import { AvailableCommands } from './components/AvailableCommands';
import { defaultCommandConfig } from './commands-config';
import { Command, InputState } from './types/command-types';

export const Citadel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<any[]>([]);

  const [inputState, setInputState] = useState<InputState>({
    commandStack: [],
    currentInput: '',
    isEnteringArg: false,
    availableCommands: defaultCommandConfig,
    validation: { isValid: true }
  });

  const actions = {
    setCommandStack: useCallback((stack: string[]) => {
      setInputState(prev => ({ ...prev, commandStack: stack }));
    }, []),

    setCurrentInput: useCallback((input: string) => {
      setInputState(prev => ({ ...prev, currentInput: input }));
    }, []),

    setIsEnteringArg: useCallback((isEntering: boolean) => {
      setInputState(prev => ({ ...prev, isEnteringArg: isEntering }));
    }, []),

    setAvailableCommands: useCallback((commands: Command[]) => {
      setInputState(prev => ({ ...prev, availableCommands: commands }));
    }, []),

    setValidation: useCallback((validation: { isValid: boolean; message?: string }) => {
      setInputState(prev => ({ ...prev, validation }));
    }, []),

    executeCommand: useCallback(async (stack: string[], args?: string[]) => {
      setIsLoading(true);
      try {
        let currentCommand: Command | undefined = undefined;
        let available = defaultCommandConfig;

        // Navigate to the final command in the stack
        for (const item of stack) {
          currentCommand = available.find(cmd => cmd.name === item);
          if (!currentCommand) throw new Error('Invalid command');
          available = currentCommand.subcommands || [];
        }

        if (!currentCommand?.handler) {
          throw new Error('No handler found for command');
        }

        const result = await currentCommand.handler(args || []);
        setOutput(result);
      } catch (error) {
        setOutput({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
      } finally {
        setIsLoading(false);
      }
    }, [])
  };

  const animationClass = useSlideAnimation(true, false);

  const outputRef = useRef<HTMLDivElement>(null);

  useGlobalShortcut({ onOpen: () => {} });

  return (
    <div className={`${styles.container} ${animationClass}`}>
      <div className={styles.innerContainer}>
        <CommandInput
          isLoading={isLoading}
          state={inputState}
          actions={actions}
          commands={defaultCommandConfig}
        />
        <CommandOutput output={output} outputRef={outputRef} />
        <AvailableCommands 
          available={inputState.availableCommands}
          currentArg={inputState.isEnteringArg}
        />
      </div>
    </div>
  );
};

export default Citadel;
