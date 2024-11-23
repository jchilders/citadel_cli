import { useCitadelKeyboard } from './hooks/useCitadelKeyboard';
import { useCitadelState } from './hooks/useCitadelState';
import { useCommandProcessor } from './hooks/useCommandProcessor';
import { useEffect } from 'react';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';

import { CommandValidationStrategy, DefaultCommandValidationStrategy } from './validation/command_validation_strategy';

import { ArgumentHelp } from './components/ArgumentHelp';
import { AvailableCommands } from './components/AvailableCommands';
import { CommandOutput } from './components/CommandOutput';
import { CommandInput } from './components/CommandInput';
import { Command } from './types/command';
import { CommandRegistry } from './commandRegistry';

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

  const { handleKeyDown } = useCitadelKeyboard({
    isOpen,
    commandStack,
    input,
    available,
    currentArg,
    validationStrategy,
    commandRegistry,
    actions,
    commandProcessor,
  });

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Show the list of available commands when the component first opens
  useEffect(() => {
    if (isOpen) {
      commandProcessor.initialize();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gray-900 text-white ${
      isClosing ? 'animate-slide-down' : 'animate-slide-up'
    }`}>
      <div className="max-w-4xl mx-auto">
        <CommandOutput output={output} outputRef={outputRef} />
        
        <div className="border-t border-gray-700 p-4">
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
