import React, { useRef, useEffect, useState } from 'react';
import { ArgumentSegment } from '../types/command-registry';
import { CitadelState, CitadelActions } from '../types/state';
import { Cursor } from '../Cursor';
import { CursorType } from '../types/cursor';
import { defaultConfig } from '../config/defaults';
import { InputState, useCommandParser } from '../hooks/useCommandParser';
import { useCitadelConfig, useCitadelCommands, useSegmentStack } from '../config/hooks';
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
  const {
    handleKeyDown,
    handleInputChange,
    inputState,
    setInputStateWithLogging,
    getNextExpectedSegment
  } = useCommandParser();
  const [showInvalidAnimation, setShowInvalidAnimation] = useState(false);
  const config = useCitadelConfig();
  const segmentStackVersion = useSegmentStackVersion();

  const onKeyDown = async (e: React.KeyboardEvent) => {
    const result = handleKeyDown(e, state, actions);
    
    // Handle both sync and async returns
    const finalResult = await Promise.resolve(result);
    
    // Trigger animation for invalid input
    if (finalResult === false) {
      setShowInvalidAnimation(true);
      setTimeout(() => setShowInvalidAnimation(false), 500);
    }
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // TODO: Set this based on nextExpectedSegment()
    // TODO: make nextExpectedSegment stateful?
    if (inputState !== 'entering_command') {
      setInputStateWithLogging('entering_command');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set the input state hen the segmentStack changes
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
    setInputStateWithLogging(nextInputState);
  }, [segmentStackVersion, inputState, getNextExpectedSegment, setInputStateWithLogging, actions]);

  // The CLI is made up of zero or more spans followed up by a div, which in
  // turn contains an input element. Each of those spans contains whatever the
  // user has previously entered, either an argument or a word. The code below
  // builds those spans. For word segments it shows the name (i.e. "show"), for
  // argument segments, the value (i.e. "1234").
  const [segmentNamesAndVals, setSegmentNamesAndVals] = useState<JSX.Element[]>([]);
  useEffect(() => {
    const segments: string[] = [];
    const elements = segmentStack.toArray().map((segment, index) => {
      segments.push(segment.name);
      const hasNextSegment = commands.hasNextSegment(segments);
      if (segment.type === 'argument') {
        const argSegment =(segment as ArgumentSegment);
        return (
          <React.Fragment key={"arg-" + argSegment.name + argSegment.value}>
            <span className="text-gray-200 whitespace-pre">
              {argSegment.value}
            </span>
            { (index < segmentStack.size() && hasNextSegment) &&
              <span className="text-gray-200 whitespace-pre"> </span>
            }
          </React.Fragment>
        );
      }
      return (
        <React.Fragment key={"word-" + segment.name}>
          <span className="text-blue-400 whitespace-pre">{segment.name}</span>
          { (index < segmentStack.size() && hasNextSegment) &&
            <span className="text-blue-400 whitespace-pre"> </span>
          }
        </React.Fragment>
      );
    });
    
    const wrappedElements = (
      <div className="flex items-center gap-1" data-testid="user-input-area" key="{segmentStackVersion}">
        {elements}
      </div>
    );
    
    setSegmentNamesAndVals([wrappedElements]);
  }, [segmentStackVersion, commands, segmentStack]);

  // Placeholder text for the input field
  const [placeholderText, setPlaceholderText] = useState<string>("");
  useEffect(() => {
    const nextExpectedSegment = getNextExpectedSegment();
    if (nextExpectedSegment.type === 'argument') {
      setPlaceholderText(nextExpectedSegment.name);
    } else {
      setPlaceholderText("");
    }
  }, [segmentStackVersion, getNextExpectedSegment]);

  return (
    <div className="flex flex-col w-full bg-gray-900 rounded-lg p-4">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes flashBorder {
          0%, 100% { border-color: transparent; }
          50% { border-color: rgb(239, 68, 68); }
        }
        .invalid-input-animation {
          animation: shake 0.2s ease-in-out, flashBorder 0.3s ease-in-out;
          border-width: 1px;
          border-style: solid;
        }
      `}</style>
      
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
              className={`w-full bg-transparent outline-none text-gray-200 caret-transparent ${showInvalidAnimation ? 'invalid-input-animation' : ''}`}
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
