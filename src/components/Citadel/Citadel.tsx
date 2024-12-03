import { useCitadelKeyboard } from './hooks/useCitadelKeyboard';
import { useCitadelState } from './hooks/useCitadelState';
import { useCommandProcessor } from './hooks/useCommandProcessor';
import { useEffect } from 'react';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';
import { useSlideAnimation } from './hooks/useSlideAnimation';

import styles from './Citadel.module.css';

import { ArgumentHelp } from './components/ArgumentHelp';
import { AvailableCommands } from './components/AvailableCommands';
import { CommandOutput } from './components/CommandOutput';
import { CommandInput } from './components/CommandInput';
import { CommandValidationStrategy, DefaultCommandValidationStrategy } from './validation/command_validation_strategy';
import { Command } from '../../services/commands/types/command';
import { CommandRegistry } from '../../services/commands/CommandRegistry';

export const Citadel: React.FC<{
  commands?: Command[],
  validationStrategy?: CommandValidationStrategy
}> = ({
  commands = [],
  validationStrategy = new DefaultCommandValidationStrategy()
}) => {
  const { state, actions, outputRef } = useCitadelState();

  const commandRegistry = new CommandRegistry();
  commandRegistry.registerCommands(commands);
  const commandProcessor = useCommandProcessor({ commandRegistry, actions });

  const {
    isOpen, isClosing, commandStack, currentArg, input,
    available, output, isLoading, inputValidation
  } = state;

  useGlobalShortcut({ onOpen: actions.open });

  useCitadelKeyboard({
    state,
    validationStrategy,
    commandRegistry,
    actions,
    commandProcessor,
  });

  // Show the list of available commands when the component first opens
  useEffect(() => {
    if (isOpen) {
      commandProcessor.initialize();
    }
  }, [isOpen]);

  const animationClass = useSlideAnimation(isOpen, isClosing);

  if (!isOpen) return null;

  return (
    <div className={`${styles.container} ${animationClass}`}>
      <div className={styles.innerContainer}>
        <CommandOutput output={output} outputRef={outputRef} />
        
        <div className={styles.inputSection}>
          <CommandInput
            isLoading={isLoading}
            commandStack={commandStack}
            input={input}
            inputValidation={inputValidation}
          />
          <ArgumentHelp currentArg={currentArg} />
          <AvailableCommands
            available={available}
            currentArg={currentArg}
          />
        </div>
      </div>
    </div>
  );
};

export default Citadel;
