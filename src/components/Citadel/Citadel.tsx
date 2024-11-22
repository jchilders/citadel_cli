import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { defaultCommandConfig } from './commands-config';
import { CommandConfig } from './types';

import { Cursor } from './Cursor';
import { defaultCursorConfig } from './cursor-config';
import { CommandValidationStrategy, DefaultCommandValidationStrategy } from './validation/command_validation_strategy';
import { useCitadelState } from './hooks/useCitadelState';
import { useCommandProcessor } from './hooks/useCommandProcessor';

export const Citadel: React.FC<{
  commands?: CommandConfig,
  validationStrategy?: CommandValidationStrategy
}> = ({
  commands = defaultCommandConfig,
  validationStrategy = new DefaultCommandValidationStrategy()
}) => {
  const { state, actions, outputRef } = useCitadelState();
  const {
    getAvailableCommands,
    getCommandFromStack,
    executeCommand,
    updateFilteredCommands,
    initialize
  } = useCommandProcessor({ commands, actions });
  const {
    isOpen, isClosing, commandStack, currentArg, input,
    available, output, isLoading, inputValidation
  } = state;

  // Show the list of available commands when the component first opens
  useEffect(() => {
    if (isOpen) {
      initialize();
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === '.') {
          e.preventDefault();
          actions.open();
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          actions.setClosing(true);
          setTimeout(() => {
            actions.close();
            actions.reset();
          }, 150);
          break;

        case 'Backspace':
          if (input === '') {
            const newStack = commandStack.slice(0, -1);
            actions.setCommandStack(newStack);
            const commands = getAvailableCommands(newStack);
            actions.setAvailable(commands);
            actions.setInput('');
            actions.setCurrentArg(null);
          } else {
            const newInput = input.slice(0, -1);
            actions.setInput(newInput);
            if (!currentArg) {
              updateFilteredCommands(newInput, available, commandStack);
            }
          }
          break;

        case 'Enter':
          await handleEnter();
          break;

        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            const newInput = input + e.key;
            // Only validate if we're not entering an argument
            if (!currentArg) {
              const validationResult = validationStrategy.validate(
                newInput,
                available.map(cmd => cmd.name)
              );

              if (!validationResult.isValid) {
                actions.setInputValidation(validationResult);
                // Reset validation state after a delay
                setTimeout(() => {
                  actions.setInputValidation({ isValid: true });
                }, 1000);
                return; // Prevent invalid input
              }
            }

            actions.setInput(newInput);
            if (!currentArg) {
              updateFilteredCommands(newInput, available, commandStack);
            }
          }
          break;
      }

      async function handleEnter() {
        e.preventDefault();
        if (currentArg) {
          if (input.trim()) {
            await executeCommand(commandStack, [input]);
          }
        } else if (available.length === 1) {
          // If there's only one command available, select it
          const selectedCommand = available[0];
          const newStack = [...commandStack, selectedCommand.name];
          actions.setCommandStack(newStack);
          const command = getCommandFromStack(newStack, commands);

          if (command?.args?.length) {
            actions.setCurrentArg(command.args[0]);
            actions.setInput('');
            actions.setAvailable([]);
          } else if (command?.handler) {
            await executeCommand(commandStack);
          }
        } else if (commandStack.length > 0) {
          // Check if we have a complete command that can be executed
          const command = getCommandFromStack(commandStack, commands);
          if (command?.handler && !command.args?.length) {
            await executeCommand(commandStack);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing, commandStack, input, available, currentArg, validationStrategy]);

  // Scroll the output pane whenever output changes so the user can see the
  // result
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Format response for display
  const formatResponse = (response: unknown) => {
    if (typeof response === 'object' && response !== null) {
      if (Array.isArray(response)) {
        return (
          <div className="pl-4 text-sm">
            {response.map((item, index) => (
              <div key={index} className="text-gray-400">
                {typeof item === 'object' && item !== null ? (
                  <span>
                    {'{'}
                    {formatResponse(item)}
                    {'}'}
                  </span>
                ) : (
                  String(item)
                )}
                {index < response.length - 1 && ','}
              </div>
            ))}
          </div>
        );
      }
  
      return (
        <div className="pl-4 space-y-0.5 text-sm">
          {Object.entries(response).map(([key, value], index, arr) => (
            <div key={key}>
              <strong className="text-gray-300">{key}</strong>
              <span className="text-gray-400">: </span>
              <span className="text-gray-400">
                {Array.isArray(value) ? (
                  <span>
                    [
                    {value.map((item, idx) => (
                      <div key={idx} className="pl-4">
                        {typeof item === 'object' && item !== null ? (
                          <span>
                            {'{'}
                            {formatResponse(item)}
                            {'}'}
                          </span>
                        ) : (
                          String(item)
                        )}
                        {idx < value.length - 1 && ','}
                      </div>
                    ))}
                    ]
                  </span>
                ) : (
                  typeof value === 'object' && value !== null ? (
                    <span>
                      {'{'}
                      {formatResponse(value)}
                      {'}'}
                    </span>
                  ) : String(value)
                )}
              </span>
              {index < arr.length - 1 && ','}
            </div>
          ))}
        </div>
      );
    }
    return <div className="pl-4 text-sm text-gray-400">{String(response)}</div>;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gray-900 text-white ${
      isClosing ? 'animate-slide-down' : 'animate-slide-up'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div ref={outputRef} className="max-h-64 overflow-y-auto p-4 font-mono"> {/* Increased height, added font-mono */}
          {output.map((item, index) => (
            <div key={index} className="mb-3"> {/* Reduced margin */}
              <div className="text-gray-500 text-sm">{item.command}</div> {/* Lighter color, smaller text */}
              {formatResponse(item.response)}
            </div>
          ))}
        </div>

        {/* Command Input Section */}
        <div className="border-t border-gray-700 p-4">
          {/* Command Line */}
          <div className="flex items-center mb-2">
            <div className="text-gray-400 mr-2">
              {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : '⟩'}
            </div>
            <div className="font-mono">
              {commandStack.join(' ')}
              {commandStack.length > 0 && ' '}
              {input}
              <Cursor
                style={defaultCursorConfig}
                isValid={inputValidation.isValid}
                errorMessage={inputValidation.message}
              />
            </div>
          </div>

          {/* Current Argument Help */}
          {currentArg && (
            <div className="text-sm text-gray-400 ml-6 mb-2">
              {currentArg.description}
            </div>
          )}

          {/* Available Commands */}
          {!currentArg && available.length > 0 && (
            <div className="mt-2 border-t border-gray-700 pt-2">
              <div className="flex flex-wrap gap-2">
                {available.map((cmd, _) => {
                  // Find how many characters need to be bold
                  const boldLength = available.reduce((length, other) => {
                    if (other.name === cmd.name) return length;
                    let commonPrefix = 0;
                    while (
                      commonPrefix < cmd.name.length &&
                      commonPrefix < other.name.length &&
                      cmd.name[commonPrefix].toLowerCase() === other.name[commonPrefix].toLowerCase()
                    ) {
                      commonPrefix++;
                    }
                    return Math.max(length, commonPrefix + 1);
                  }, 1);

                  return (
                    <div
                      key={cmd.name}
                      className="px-2 py-1 rounded bg-gray-800"
                    >
                      <span className="font-mono text-white">
                        <strong className="underline">{cmd.name.slice(0, boldLength)}</strong>
                        {cmd.name.slice(boldLength)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Citadel;
