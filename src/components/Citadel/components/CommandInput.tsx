import React, { useRef, useEffect, useState } from 'react';
import { ArgumentSegment } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { Cursor } from '../Cursor';
import { CursorType } from '../types/cursor';
import { defaultConfig } from '../config/defaults';
import { InputState, useCommandParser } from '../hooks/useCommandParser';
import { useCitadelConfig, useCitadelCommands, useSegmentStack } from '../config/CitadelConfigContext';
import styles from './CommandInput.module.css';
import { useSegmentStackVersion } from '../hooks/useSegmentStackVersion';

interface CommandInputProps {
  state: CitadelState;
  actions: CitadelActions;
}

export const CommandInput: React.FC<CommandInputProps> = ({
  state,
  actions
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const commands = useCitadelCommands();
  const segmentStack = useSegmentStack();
  const { handleKeyDown, handleInputChange, inputState, setInputStateWithLogging, getNextExpectedSegment } = useCommandParser({ commands });
  const [showInvalidAnimation ] = useState(false);
  const config = useCitadelConfig();
  const segmentStackVersion = useSegmentStackVersion();

  const onKeyDown = (e: React.KeyboardEvent) => {
    console.log("[CommandInput][onKeyDown]");
    handleKeyDown(e, state, actions);
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[CommandInput][onInputChange]. value: ", event.target.value);
    handleInputChange(event.target.value, actions);
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text');
    handleInputChange(pastedText, actions);
  };

  // Focus input and set initial input state on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if (inputState !== 'entering_command') {
      setInputStateWithLogging('entering_command');
    }
  }, []);

  // Re-focus input when command stack changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [segmentStackVersion]);

  // React to inputState changes
  useEffect(() => {
    if (inputState !== 'idle') return;
      
    const nextExpectedSegment = getNextExpectedSegment();
    let nextInputState: InputState = 'idle';
    switch (nextExpectedSegment.type) {
      case 'word':
        nextInputState = 'entering_command';
        actions.setIsEnteringArg(false);
        break;
      case 'argument':
        nextInputState = 'entering_argument';
        actions.setIsEnteringArg(true);
        break;
      default:
        break;
    }
    console.log(`[CommandInput] changing inputState to '${nextInputState}'`);
    setInputStateWithLogging(nextInputState);
  }, [segmentStackVersion]);

  // For word segments, show the name. For argument segments, show the value.
  const [segmentNamesAndVals, setSegmentNamesAndVals] = useState<JSX.Element[]>([]);
  useEffect(() => {
    const segments: string[] = [];
    const elements = segmentStack.toArray().map((segment, index) => {
      segments.push(segment.name);
      const hasNextSegment = commands.hasNextSegment(segments);
      if (segment.type === 'argument') {
        return (
          <React.Fragment key={index}>
            <span className="text-gray-400 whitespace-pre">
              {(segment as ArgumentSegment).value}
            </span>
            { (index < segmentStack.size() && hasNextSegment) &&
              <span className="text-red-400 whitespace-pre"> </span>
            }
          </React.Fragment>
        );
      }
      return (
        <React.Fragment key={index}>
          <span className="text-blue-400 whitespace-pre">{segment.name}</span>
          { (index < segmentStack.size() && hasNextSegment) &&
            <span className="text-blue-400 whitespace-pre"> </span>
          }
        </React.Fragment>
      );
    });
    
    const wrappedElements = (
      <div className="flex items-center gap-1" data-testid="user-input-area">
        {elements}
      </div>
    );
    
    setSegmentNamesAndVals([wrappedElements]);
  }, [segmentStackVersion, state.isEnteringArg]);

  // Placeholder text for the input field
  const [placeholderText, setPlaceholderText] = useState<string>("");
  useEffect(() => {
    const nextExpectedSegment = getNextExpectedSegment();
    if (nextExpectedSegment.type === 'argument') {
      setPlaceholderText(nextExpectedSegment.name);
    } else {
      setPlaceholderText("");
    }
    console.log("[CommandInput] placeholderText:", placeholderText);
  });

  return (
    <div className="flex flex-col w-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <div className="text-gray-400 font-mono">&gt;</div>
        <div className="flex-1 font-mono flex items-center">
          {segmentNamesAndVals}
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
              placeholder={placeholderText}
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
