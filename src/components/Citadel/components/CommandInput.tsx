import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CommandNode } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { useCommandParser } from '../hooks/useCommandParser';
import styles from './CommandInput.module.css';

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
  const [showInvalidAnimation, setShowInvalidAnimation] = useState(false);

  // Helper function to check if input would match any available command
  const isValidCommandPrefix = useCallback((input: string, availableNodes: CommandNode[]): boolean => {
    return availableNodes.some(node => 
      node.name.toLowerCase().startsWith(input.toLowerCase())
    );
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (inputRef.current) {
        // Always allow special keys
        if (e.key === 'Backspace' || 
            e.key === 'Escape' ||
            e.key === 'Tab' ||
            e.key === 'Shift' ||
            e.key === 'Control' ||
            e.key === 'Alt' ||
            e.key === 'Meta' ||
            e.key === 'ArrowLeft' ||
            e.key === 'ArrowRight' ||
            e.key === 'ArrowUp' ||
            e.key === 'ArrowDown' ||
            e.key === 'Enter' ||
            e.key.length > 1) {  // Ignore all special keys that produce strings longer than 1 char
          handleKeyDown(e, state, actions);
          return;
        }

        // Only validate when not entering arguments
        if (!state.isEnteringArg) {
          // If we're at root level, use availableCommands
          // Otherwise, use the current node's children if they exist
          const currentCommands = state.currentNode?.children ? 
            Array.from(state.currentNode.children.values()) : 
            availableCommands;
          
          const newInput = (state.currentInput + e.key).toLowerCase();
          
          // Show error if the new input wouldn't match any commands
          if (!isValidCommandPrefix(newInput, currentCommands)) {
            e.preventDefault();
            setShowInvalidAnimation(true);
            setTimeout(() => setShowInvalidAnimation(false), 300);
            return;
          }
        }
        
        handleKeyDown(e, state, actions);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyDown, state, actions, availableCommands, isValidCommandPrefix]);

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

  return (
    <div className="flex flex-col w-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <div className="text-gray-400 font-mono">&gt;</div>
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
            className={`flex-1 bg-transparent outline-none text-gray-200 ${showInvalidAnimation ? styles.invalidInput : ''}`}
          />
        </div>
      </div>
      {state.validation.message && (
        <div className={`mt-2 text-sm ${state.validation.isValid ? 'text-green-500' : 'text-red-500'}`}>
          {state.validation.message}
        </div>
      )}
    </div>
  );
};