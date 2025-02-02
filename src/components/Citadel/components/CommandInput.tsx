import React, { useRef, useEffect, useState } from 'react';
import { ArgumentSegment } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { Logger } from '../utils/logger';
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
    Logger.debug('[CommandInput] onKeyDown', { key: e.key, state });

    // Handle special keys first
    switch (e.key) {
      case 'Alt':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'Meta':
      case 'Shift':
      case 'Tab':
        handleKeyDown(e.nativeEvent, state, actions);
        return;

      case 'Escape':
        handleKeyDown(e.nativeEvent, state, actions);
        if (state.isEnteringArg) {
          actions.setIsEnteringArg(false);
          actions.setCurrentInput('');
        }
        return;

      case 'Backspace':
        e.preventDefault();
        if (state.currentInput === '') {
          // Remove last item from command stack
          if (state.commandStack.length > 0) {
            const newStack = state.commandStack.slice(0, -1);
            actions.setCommandStack(newStack);
            actions.setCurrentNode(commands.getCommand(newStack));
            actions.setIsEnteringArg(false);
          }
        } else {
          // Remove last character from current input
          actions.setCurrentInput(state.currentInput.slice(0, -1));
        }
        return;

      case 'Enter':
        e.preventDefault();
        if (state.currentNode && state.commandStack.length === state.currentNode.segments.length) {
          // All segments are filled, execute command
          const args = state.currentNode.segments
            .filter((seg): seg is ArgumentSegment => seg instanceof ArgumentSegment)
            .map(arg => arg.value);
          
          handleKeyDown(e.nativeEvent, state, actions);
          actions.executeCommand(state.commandStack, args);
          actions.setCommandStack([]);
          actions.setCurrentInput('');
          actions.setCurrentNode(undefined);
          actions.setIsEnteringArg(false);
        }
        return;

      case ' ':
        e.preventDefault();
        if (state.isEnteringArg) {
          const currentInput = state.currentInput;
          if (currentInput.startsWith('"') || currentInput.startsWith("'")) {
            // Allow spaces in quoted arguments
            actions.setCurrentInput(currentInput + e.key);
          } else {
            // Complete unquoted argument
            const currentSegment = state.currentNode?.segments[state.commandStack.length - 1];
            if (currentSegment instanceof ArgumentSegment) {
              currentSegment.value = currentInput;
              actions.setIsEnteringArg(false);
              actions.setCurrentInput('');
            }
          }
        }
        return;
    }

    e.preventDefault();
    
    // Handle argument input
    if (state.isEnteringArg) {
      Logger.debug('[CommandInput] Handling argument input');
      const currentInput = state.currentInput;
      
      // Handle quote completion
      if ((e.key === '"' && currentInput.startsWith('"')) || 
          (e.key === "'" && currentInput.startsWith("'"))) {
        const argValue = currentInput.substring(1); // Remove opening quote
        const currentSegment = state.currentNode?.segments[state.commandStack.length];
        if (currentSegment instanceof ArgumentSegment) {
          currentSegment.value = argValue;
          actions.setIsEnteringArg(false);
          actions.setCurrentInput('');
          
          // If there are more segments, prepare for next one
          if (state.currentNode && state.commandStack.length < state.currentNode.segments.length - 1) {
            const nextSegment = state.currentNode.segments[state.commandStack.length + 1];
            if (nextSegment instanceof ArgumentSegment) {
              actions.setIsEnteringArg(true);
            }
          }
        }
        return;
      }

      // Handle space for unquoted arguments
      if (e.key === ' ' && !currentInput.startsWith('"') && !currentInput.startsWith("'")) {
        const currentSegment = state.currentNode?.segments[state.commandStack.length];
        if (currentSegment instanceof ArgumentSegment) {
          currentSegment.value = currentInput;
          actions.setIsEnteringArg(false);
          actions.setCurrentInput('');
          
          // If there are more segments, prepare for next one
          if (state.currentNode && state.commandStack.length < state.currentNode.segments.length - 1) {
            const nextSegment = state.currentNode.segments[state.commandStack.length + 1];
            if (nextSegment instanceof ArgumentSegment) {
              actions.setIsEnteringArg(true);
            }
          }
        }
        return;
      }

      // Allow any character in argument mode
      actions.setCurrentInput(currentInput + e.key);
      return;
    }

    // Handle command word input
    Logger.debug('[CommandInput] Handling command word input');
    const nextInput = state.currentInput + e.key;
    const completions = availableCommands.filter(cmd => 
      cmd.toLowerCase().startsWith(nextInput.toLowerCase())
    );

    Logger.debug('[CommandInput] completions', { nextInput, completions });

    if (completions.length > 0) {
      if (completions.length === 1) {
        // Single completion - autocomplete it
        const completion = completions[0];
        const newStack = [...state.commandStack, completion];
        actions.setCommandStack(newStack);
        actions.setCurrentInput('');

        // Get the new node and check if next segment is an argument
        const newNode = commands.getCommand(newStack);
        actions.setCurrentNode(newNode);
        
        if (newNode) {
          const nextSegment = newNode.segments[newStack.length];
          if (nextSegment instanceof ArgumentSegment) {
            actions.setIsEnteringArg(true);
          }
        }
      } else {
        // Multiple possibilities - just add the character
        actions.setCurrentInput(nextInput);
      }
    }
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
