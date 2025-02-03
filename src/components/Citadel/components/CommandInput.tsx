import React, { useRef, useEffect, useState } from 'react';
import { CommandSegment } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { Logger } from '../utils/logger';
import { useCommandParser } from '../hooks/useCommandParser';
import { Cursor } from '../Cursor';
import { defaultConfig } from '../config/defaults';
import { useCitadelConfig, useCitadelCommands } from '../config/CitadelConfigContext';
import styles from './CommandInput.module.css';
import { CursorType } from '../types/cursor';
import { SegmentStackActions } from '../types/segment-actions';

interface CommandInputProps {
  state: CitadelState;
  actions: CitadelActions;
  segmentActions: SegmentStackActions;
  availableCommandSegments: CommandSegment[];
}

export const CommandInput: React.FC<CommandInputProps> = ({
  state,
  actions
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const commands = useCitadelCommands();
  const { handleKeyDown, handleInputChange } = useCommandParser({ commands });
  const [showInvalidAnimation ] = useState(false);
  const config = useCitadelConfig();

  const onKeyDown = (e: React.KeyboardEvent) => {
    Logger.debug('[CommandInput] onKeyDown', { key: e.key, state });
    handleKeyDown(e, state, actions);
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
              placeholder={state.isEnteringArg ? (state.segmentStack.peek()?.name) : ''}
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
