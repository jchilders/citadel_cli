import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Cursor } from '../Cursor';
import { defaultCursorConfig } from '../cursor-config';
import { Command, InputState, CommandInputActions } from '../types/command-types';
import { useCommandParser } from '../hooks/useCommandParser';
import { CommandSuggestions } from './CommandSuggestions';

interface CommandInputProps {
  isLoading: boolean;
  state: InputState;
  actions: CommandInputActions;
  commands: Command[];
}

export const CommandInput: React.FC<CommandInputProps> = ({
  isLoading,
  state,
  actions,
  commands,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleKeyDown, getAutocompleteSuggestion, getCurrentCommand } = useCommandParser(commands);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (inputRef.current) {
        handleKeyDown(e, state, actions);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyDown, state, actions]);

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text');
    actions.setCurrentInput(pastedText);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    actions.setCurrentInput(newValue);

    // Only auto-complete if we're not entering an argument
    if (!state.isEnteringArg) {
      const suggestion = getAutocompleteSuggestion(newValue, state.availableCommands);
      if (suggestion && suggestion !== newValue) {
        const matchingCommand = state.availableCommands.find(cmd => cmd.name === suggestion);
        
        // Update input with suggestion and space if there are subcommands or args
        const shouldAddSpace = matchingCommand && (matchingCommand.subcommands || matchingCommand.args);
        actions.setCurrentInput(suggestion + (shouldAddSpace ? ' ' : ''));
        
        // If there are subcommands, update the command stack and available commands
        if (matchingCommand?.subcommands) {
          const newStack = [...state.commandStack, suggestion];
          actions.setCommandStack(newStack);
          actions.setCurrentInput('');
          actions.setAvailableCommands(matchingCommand.subcommands);
        }
        
        // If there are arguments, enter argument mode
        if (matchingCommand?.args) {
          const newStack = [...state.commandStack, suggestion];
          actions.setCommandStack(newStack);
          actions.setCurrentInput('');
          actions.setIsEnteringArg(true);
        }

        // Select the auto-completed portion if we haven't moved to the next state
        if (inputRef.current && !shouldAddSpace) {
          const selectionStart = newValue.length;
          inputRef.current.setSelectionRange(selectionStart, suggestion.length);
        }
      }
    }
  };

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Get the current command to show argument description if needed
  const currentCommand = getCurrentCommand(state.commandStack, commands);
  const argumentDescription = state.isEnteringArg && currentCommand?.args?.[0]?.description;

  return (
    <div className="flex flex-col w-full mb-2">
      <div className="flex items-center">
        <div className="text-gray-400 mr-2">
          {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : '⟩'}
        </div>
        <div className="flex-1 font-mono flex items-center">
          <span className="whitespace-pre">
            {state.commandStack.join(' ')}
            {state.commandStack.length > 0 && ' '}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={state.currentInput}
            onChange={handleInputChange}
            className="flex-1 bg-transparent outline-none"
            placeholder={argumentDescription || "Enter a command..."}
          />
          <Cursor
            style={defaultCursorConfig}
            isValid={state.validation.isValid}
            errorMessage={state.validation.message}
          />
        </div>
      </div>
      {!state.isEnteringArg && state.availableCommands.length > 0 && (
        <CommandSuggestions commands={state.availableCommands} />
      )}
    </div>
  );
};