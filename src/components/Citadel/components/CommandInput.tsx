import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ArgumentSegment } from '../types/command-registry';
import { CitadelState, CitadelActions } from '../types/state';
import { Cursor } from '../Cursor';
import { CursorType } from '../types/cursor';
import { defaultConfig } from '../config/defaults';
import { InputState, useCommandParser } from '../hooks/useCommandParser';
import { useCitadelConfig, useCitadelCommands, useSegmentStack } from '../config/hooks';
import { useSegmentStackVersion } from '../hooks/useSegmentStackVersion';
import { resolveTypography } from '../utils/typography';

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
  const inputTypography = useMemo(
    () => resolveTypography(config.fontFamily, config.fontSize),
    [config.fontFamily, config.fontSize]
  );

  const onKeyDown = async (e: React.KeyboardEvent) => {
    const result = handleKeyDown(e, state, actions);
    
    // Handle both sync and async returns
    const finalResult = await Promise.resolve(result);
    
    // Trigger animation for invalid input
    const INVALID_INPUT_ANIMATION_MS = 500;
    if (finalResult === false) {
      setShowInvalidAnimation(true);
      setTimeout(() => setShowInvalidAnimation(false), INVALID_INPUT_ANIMATION_MS);
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

    if (inputState !== 'entering_command') {
      setInputStateWithLogging('entering_command');
    }
  }, [inputState, setInputStateWithLogging]);

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
  const segmentNamesAndVals = useMemo<JSX.Element[]>(() => {
    const segments: string[] = [];
    const elements = segmentStack.toArray().map((segment, index) => {
      segments.push(segment.name);
      const hasNextSegment = commands.hasNextSegment(segments);
      if (segment.type === 'argument') {
        const argSegment = (segment as ArgumentSegment);
        return (
          <React.Fragment key={"arg-" + argSegment.name + argSegment.value}>
            <span className="citadel-input-segment-arg">
              {argSegment.value}
            </span>
            { (index < segmentStack.size() && hasNextSegment) &&
              <span className="citadel-input-segment-space"> </span>
            }
          </React.Fragment>
        );
      }
      return (
        <React.Fragment key={"word-" + segment.name}>
          <span className="citadel-input-segment-word">{segment.name}</span>
          { (index < segmentStack.size() && hasNextSegment) &&
            <span className="citadel-input-segment-space citadel-input-segment-space-command"> </span>
          }
        </React.Fragment>
      );
    });

    return [(
      <div className="citadel-input-segments" data-testid="user-input-area" key={segmentStackVersion}>
        {elements}
      </div>
    )];
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

  const isCommandEntryMode = !state.isEnteringArg;
  const cursorInputLength = state.currentInput.length;
  const inputModeClass = isCommandEntryMode ? 'is-command-mode' : 'is-argument-mode';

  return (
    <div className="citadel-input-shell">
      <div
        className="citadel-input-line"
        style={inputTypography.style}
      >
        <div className="citadel-input-prompt">&gt;</div>
        <div className="citadel-input-row">
          {segmentNamesAndVals}
          <div className="citadel-input-control">
            <input
              ref={inputRef}
              type="text"
              role="textbox"
              value={state.currentInput}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              onPaste={handlePaste}
              data-testid="citadel-command-input"
              className={`citadel-input-field ${inputModeClass} ${showInvalidAnimation ? 'invalid-input-animation' : ''}`.trim()}
              spellCheck={false}
              autoComplete="off"
              placeholder={placeholderText}
            />
            <div 
              className="citadel-input-cursor"
              style={{
                left: `${cursorInputLength}ch`,
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
