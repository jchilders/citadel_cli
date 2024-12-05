import React, { useEffect, useRef } from 'react';
import { CommandNode } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { useCommandParser } from '../hooks/useCommandParser';

interface CommandInputProps {
  state: CitadelState;
  actions: CitadelActions;
  availableCommands: CommandNode[];
}

export const CommandInput: React.FC<CommandInputProps> = ({
  state,
  actions,
  availableCommands,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleKeyDown, handleInputChange } = useCommandParser();

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
    handleInputChange(pastedText, state, actions);
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(event.target.value, state, actions);
  };

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Re-focus input when command stack changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.commandStack]);

  const getPromptText = () => {
    if (state.isEnteringArg && state.currentNode?.argument) {
      return state.currentNode.argument.name;
    }
    return '>';
  };

  return (
    <div className="flex flex-col w-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <div className="text-gray-400 font-mono">{getPromptText()}</div>
        <div className="flex-1 font-mono flex items-center">
          <span className="text-blue-400 whitespace-pre">
            {state.commandStack.join(' ')}
            {state.commandStack.length > 0 && ' '}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={state.currentInput}
            onChange={onInputChange}
            onPaste={handlePaste}
            className="flex-1 bg-transparent outline-none text-gray-200"
            placeholder={state.isEnteringArg && state.currentNode?.argument 
              ? state.currentNode.argument.description 
              : 'Enter a command...'}
          />
        </div>
      </div>
      {!state.isEnteringArg && availableCommands.length > 0 && (
        <div className="mt-2 text-sm text-gray-500">
          {availableCommands.map(cmd => (
            <div key={cmd.name} className="flex items-start gap-2">
              <span className="text-blue-400">{cmd.name}</span>
              <span className="text-gray-600">{cmd.description}</span>
            </div>
          ))}
        </div>
      )}
      {state.validation.message && (
        <div className={`mt-2 text-sm ${state.validation.isValid ? 'text-green-500' : 'text-red-500'}`}>
          {state.validation.message}
        </div>
      )}
    </div>
  );
};