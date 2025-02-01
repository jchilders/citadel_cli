import React, { useRef, useEffect, useState } from 'react';
import { CommandNode } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { useCommandParser, parseInput } from '../hooks/useCommandParser';
import { Cursor } from '../Cursor';
import { defaultConfig } from '../config/defaults';
import { useCitadelConfig, useCitadelCommands } from '../config/CitadelConfigContext';
import styles from './CommandInput.module.css';
import { CursorType } from '../types/cursor';

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
  const commands = useCitadelCommands();
  const { handleKeyDown, handleInputChange } = useCommandParser({ commands });
  const [showInvalidAnimation, setShowInvalidAnimation] = useState(false);
  const config = useCitadelConfig();

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

    // Get the next expected segment
    const nextSegment = state.currentNode?.segments[state.commandStack.length];

    // Allow any input when entering arguments or when the next segment is an argument
    if (state.isEnteringArg || nextSegment?.type === 'argument') {
      handleKeyDown(e.nativeEvent, state, actions);
      return;
    }

    // For non-special keys, validate the input
    if (!isValidKey) {
      const parsedInput = parseInput(state.currentInput + e.key);
      const currentCommands = availableCommands;
      
      // Check if the new input would be valid
      const isValid = currentCommands.some(node => {
        const segment = node.segments[state.commandStack.length];
        return segment?.type === 'word' && 
               segment.name.toLowerCase().startsWith(parsedInput.currentWord.toLowerCase());
      });

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
          </span>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              role="textbox"
              value={state.currentInput}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              onPaste={handlePaste}
              data-testid="citadel-command-input"
              className={`w-full bg-transparent outline-none text-gray-200 caret-transparent ${showInvalidAnimation ? styles.invalidInput : ''}`}
              spellCheck={false}
              autoComplete="off"
              placeholder={state.isEnteringArg ? (state.currentNode?.segments[state.commandStack.length]?.name ?? '') : ''}
            />
            <div 
              className="absolute top-0 pointer-events-none"
              style={{
                left: `${state.currentInput.length}ch`,
                transition: 'left 0.05s ease-out'
              }}
            >
              <Cursor 
                style={{ 
                  type: (config.cursorType ?? defaultConfig.cursorType) as CursorType,
                  color: config.cursorColor || defaultConfig.cursorColor,
                  speed: config.cursorSpeed || defaultConfig.cursorSpeed
                }}
                isValid={!showInvalidAnimation && state.validation.isValid}
                errorMessage={state.validation.message}
              />
            </div>
          </div>
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
