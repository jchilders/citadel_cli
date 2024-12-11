import React, { useRef, useEffect, useState } from 'react';
import { CommandNode, CommandTrie } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { useCommandParser } from '../hooks/useCommandParser';
import styles from './CommandInput.module.css';

interface CommandInputProps {
  state: CitadelState;
  actions: CitadelActions;
  availableCommands: CommandNode[];
  commandTrie: CommandTrie;
}

export const CommandInput: React.FC<CommandInputProps> = ({
  state,
  actions,
  availableCommands,
  commandTrie,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleKeyDown, handleInputChange } = useCommandParser({ commandTrie });
  const [showInvalidAnimation, setShowInvalidAnimation] = useState(false);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const isValidKey = e.key === 'Backspace' || 
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
      e.key === 'Enter';

    // Prevent input for leaf nodes without handlers or arguments
    if (!isValidKey && !state.isEnteringArg && !state.currentNode?.hasChildren) {
      if (state.currentNode && !state.currentNode.requiresArgument && !state.currentNode.handler) {
        e.preventDefault();
        return;
      }
    }

    // Show animation for invalid input
    if (!isValidKey && !state.isEnteringArg && !state.currentNode?.requiresArgument) {
      const currentCommands = state.currentNode ? 
        Array.from(state.currentNode.children.values()) : 
        availableCommands;
      
      const newInput = (state.currentInput + e.key).toLowerCase();
      const isValid = currentCommands.some(node => 
        node.name.toLowerCase().startsWith(newInput)
      );

      if (!isValid) {
        setShowInvalidAnimation(true);
        setTimeout(() => setShowInvalidAnimation(false), 300);
        e.preventDefault();
        return;
      }
    }

    handleKeyDown(e.nativeEvent, state, actions);
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(event.target.value, state, actions);
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text');
    handleInputChange(pastedText, state, actions);
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
          <span className="text-blue-400 whitespace-pre" data-testid="user-input-area">
            {state.commandStack.join(' ')}
            {state.commandStack.length > 0 && ' '}
            {state.isEnteringArg && state.currentNode?.argument?.prompt}
          </span>
          <input
            ref={inputRef}
            type="text"
            role="textbox"
            value={state.currentInput}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            onPaste={handlePaste}
            data-testid="citadel-command-input"
            className={`flex-1 bg-transparent outline-none text-gray-200 ${showInvalidAnimation ? styles.invalidInput : ''}`}
            spellCheck={false}
            autoComplete="off"
            placeholder={state.isEnteringArg ? 'Enter argument...' : 'Type a command...'}
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