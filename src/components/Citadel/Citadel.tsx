import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';
import { useSlideAnimation } from './hooks/useSlideAnimation';
import styles from './Citadel.module.css';
import { CommandInput } from './components/CommandInput';
import { CommandOutput } from './components/CommandOutput';
import { AvailableCommands } from './components/AvailableCommands';
import { defaultCommandConfig } from './commands-config';
import { Command, InputState, CommandArg } from './types/command-types';
import { CitadelConfig } from './config/types';
import { defaultConfig } from './config/defaults';
import { OutputItem } from './types';

const getCurrentCommand = (commandStack: string[], availableCommands: Command[]): Command | undefined => {
  let currentCommand: Command | undefined = undefined;
  let available = availableCommands;

  // Navigate to the final command in the stack
  for (const item of commandStack) {
    currentCommand = available.find(cmd => cmd.name === item);
    if (!currentCommand) return undefined;
    available = currentCommand.subcommands || [];
  }

  return currentCommand;
};

const getCommandArgForCommand = (command: Command | undefined): CommandArg | undefined => {
  if (!command || !command.args) {
    return undefined;
  }
  return command.args.at(-1);
};

export const Citadel: React.FC<{ config?: CitadelConfig }> = ({ config = defaultConfig }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<OutputItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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
      console.log(`Executing command. stack: [${stack.join(', ')}]`);
      setIsLoading(true);
      console.log("-- here 1");
      try {
        let currentCommand: Command | undefined = undefined;
        let available = defaultCommandConfig;
        console.log("-- here 1.1");

        for (const item of stack) {
          console.log("-- here 1.1.1");
          currentCommand = available.find(cmd => cmd.name === item);
          console.log("-- here 1.1.2 currentCommand: ", currentCommand);
          if (!currentCommand) throw new Error('Invalid command');
          available = currentCommand.subcommands || [];
          console.log("-- here 1.1.3 available: ", available);
        }

        if (!currentCommand?.handler) {
          throw new Error('No handler found for command');
        }
        console.log("-- here 1.2");

        console.log(`Executing command: ${currentCommand.name}`);
        const result = await currentCommand.handler(args || []);
        console.log(`Command result: ${JSON.stringify(result)}`);
        setOutput(result);
      } catch (error) {
        setOutput({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
      } finally {
        setIsLoading(false);
      }
    }, [])
  };

  const outputRef = useRef<HTMLDivElement>(null);
  const currentCommand = getCurrentCommand(inputState.commandStack, defaultCommandConfig);

  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  useGlobalShortcut({ 
    onOpen: () => {
      setIsClosing(false);
      setIsVisible(true);
    },
    onClose: handleClose,
    isVisible
  });

  // Reset state when closing unless configured to not do so
  useEffect(() => {
    if (!isVisible && config.resetStateOnEscape) {
      setInputState({
        commandStack: [],
        currentInput: '',
        isEnteringArg: false,
        availableCommands: defaultCommandConfig,
        validation: { isValid: true }
      });
      setOutput([]);
    }
  }, [isVisible, config.resetStateOnEscape]);

  const animationClass = useSlideAnimation(isVisible, isClosing);

  if (!isVisible && !isClosing) return null;

  return (
    <div className={`${styles.container} ${animationClass}`}>
      <div className={styles.innerContainer}>
        <CommandOutput output={output} outputRef={outputRef} />
        <div className="flex flex-col">
          <CommandInput
            isLoading={isLoading}
            state={inputState}
            actions={actions}
            commands={defaultCommandConfig}
          />
          <AvailableCommands 
            available={inputState.availableCommands}
            currentArg={getCommandArgForCommand(currentCommand)}
            currentCommand={currentCommand}
          />
        </div>
      </div>
    </div>
  );
};

export default Citadel;
