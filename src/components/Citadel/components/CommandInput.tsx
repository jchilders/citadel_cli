import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Cursor } from '../Cursor';
import { defaultCursorConfig } from '../cursor-config';
import { Command, InputState, CommandInputActions } from '../types/command-types';
import { useCommandParser } from '../hooks/useCommandParser';

interface CommandInputProps {
  isLoading: boolean;
  state: InputState;
  actions: CommandInputActions;
  commands: Command[];
}

export const CommandInput: React.FC<CommandInputProps> = ({
  isLoading,
  state,
  actions,
  commands,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleKeyDown, handleInputChange } = useCommandParser(commands);

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

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center">
        <div className="text-gray-400 mr-2">⟩</div>
        <div className="flex-1 font-mono flex items-center">
          <span className="whitespace-pre">
            {state.commandStack.join(' ')}
            {state.commandStack.length > 0 && ' '}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={state.currentInput}
            onChange={onInputChange}
            onPaste={handlePaste}
            className="flex-1 bg-transparent outline-none"
            placeholder="Type a command..."
          />
          {isLoading && (
            <Loader2 className="animate-spin h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>
    </div>
  );
};