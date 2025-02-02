import React, { useRef, useEffect, useState } from 'react';
import { ArgumentSegment } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { useCommandParser } from '../hooks/useCommandParser';
import { Cursor } from '../Cursor';
import { defaultConfig } from '../config/defaults';
import { useCitadelConfig, useCitadelCommands } from '../config/CitadelConfigContext';
import styles from './CommandInput.module.css';
import { CursorType } from '../types/cursor';

interface CommandInputProps {
  state: CitadelState;
  actions: CitadelActions;
  availableCommands: string[];
}

export const CommandInput: React.FC<CommandInputProps> = ({
  state,
  actions,
  availableCommands,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const commands = useCitadelCommands();
  const { handleKeyDown, handleInputChange } = useCommandParser({ commands });
  const [showInvalidAnimation ] = useState(false);
  const config = useCitadelConfig();

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Handle special keys first
    switch (e.key) {
      case 'Alt':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'Backspace':
      case 'Escape':
      case 'Meta':
      case 'Shift':
      case 'Tab':
        handleKeyDown(e.nativeEvent, state, actions);
        return;
      
      case 'Enter':
        // Only allow Enter if all segments are filled
        const currentNode = state.currentNode;
        if (currentNode && state.commandStack.length === currentNode.segments.length) {
          handleKeyDown(e.nativeEvent, state, actions);
          // Reset state after executing command
          actions.setCommandStack([]);
          actions.setCurrentInput('');
          actions.setCurrentNode(undefined);
          actions.setIsEnteringArg(false);
        }
        return;

      case ' ':
        // Space handling depends on argument state
        if (state.isEnteringArg) {
          const currentInput = state.currentInput;
          if (currentInput.startsWith('"') || currentInput.startsWith("'")) {
            // In quoted argument - allow space
            actions.setCurrentInput(state.currentInput + e.key);
          } else {
            // Unquoted argument - complete it
            const currentSegment = state.currentNode?.segments[state.commandStack.length - 1];
            if (currentSegment?.type === 'argument' && currentSegment instanceof ArgumentSegment) {
              currentSegment.value = state.currentInput;
              actions.setIsEnteringArg(false);
              actions.setCurrentInput('');
            }
          }
        }
        e.preventDefault();
        return;
    }

    // Get current segment we're working with
    const currentSegmentIndex = state.commandStack.length;
    const currentNode = state.currentNode;
    const currentSegment = currentNode?.segments[currentSegmentIndex];

    // Handle argument input
    if (state.isEnteringArg) {
      const currentInput = state.currentInput;
      
      // Check for quote completion
      if ((e.key === '"' && currentInput.startsWith('"')) || 
          (e.key === "'" && currentInput.startsWith("'"))) {
        // Complete quoted argument
        const argValue = currentInput.substring(1); // Remove opening quote
        const currentSegment = state.currentNode?.segments[state.commandStack.length - 1];
        if (currentSegment?.type === 'argument' && currentSegment instanceof ArgumentSegment) {
          currentSegment.value = argValue;
          actions.setIsEnteringArg(false);
          actions.setCurrentInput('');
        }
        e.preventDefault();
        return;
      }

      // Allow any character in argument mode
      actions.setCurrentInput(currentInput + e.key);
      e.preventDefault();
      return;
    }

    // Handle command word input
    if (!currentSegment) {
      // At root level, check available commands
      const completions = availableCommands
        .filter(cmd => cmd.segments[0].type === 'word' &&
                      cmd.segments[0].name.toLowerCase()
                        .startsWith((state.currentInput + e.key).toLowerCase()))
        .map(cmd => cmd.segments[0].name);

      if (completions.length > 0) {
        // If single completion, autocomplete it
        if (completions.length === 1) {
          const completion = completions[0];
          actions.setCommandStack([completion]);
          actions.setCurrentInput('');
          
          // Set current node
          const newNode = availableCommands.find(cmd => cmd.segments[0].name === completion);
          if (newNode) {
            actions.setCurrentNode(newNode);
          }
        } else {
          // Multiple possibilities - just add the character
          actions.setCurrentInput(state.currentInput + e.key);
        }
      }
      e.preventDefault();
      return;
    } else if (currentSegment.type === 'word') {
      // Handle subcommand completions
      const completions = availableCommands
        .filter(cmd => cmd.segments[currentSegmentIndex]?.type === 'word' &&
                      cmd.segments[currentSegmentIndex].name.toLowerCase()
                        .startsWith((state.currentInput + e.key).toLowerCase()))
        .map(cmd => cmd.segments[currentSegmentIndex].name);

      if (completions.length > 0) {
        // If single completion, autocomplete it
        if (completions.length === 1) {
          const completion = completions[0];
          actions.setCommandStack([...state.commandStack, completion]);
          actions.setCurrentInput('');
          
          // Check if next segment is argument
          const nextSegment = currentNode?.segments[currentSegmentIndex + 1];
          if (nextSegment?.type === 'argument') {
            actions.setIsEnteringArg(true);
          }
        } else {
          // Multiple possibilities - just add the character
          actions.setCurrentInput(state.currentInput + e.key);
        }
      }
    } else if (currentSegment.type === 'argument') {
      // Starting a new argument
      actions.setIsEnteringArg(true);
      if (e.key === '"' || e.key === "'") {
        actions.setCurrentInput(e.key);
      } else {
        actions.setCurrentInput(e.key);
      }
    }

    e.preventDefault();
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
