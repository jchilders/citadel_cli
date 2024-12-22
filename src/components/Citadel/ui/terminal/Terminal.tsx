import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { TerminalProps, TerminalState } from '../types';
import './Terminal.css';

export const Terminal: React.FC<TerminalProps> = ({
  onCommand,
  history,
  placeholder = 'Type a command...',
  autoFocus = true,
  disabled = false,
}) => {
  const [state, setState] = useState<TerminalState>({
    commandHistory: history,
    historyIndex: history.length,
    currentInput: '',
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    setState(prev => ({
      ...prev,
      commandHistory: history,
      historyIndex: history.length,
    }));
  }, [history]);

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (!state.currentInput.trim()) return;

        try {
          await onCommand(state.currentInput);
          setState(prev => ({
            ...prev,
            currentInput: '',
            historyIndex: prev.commandHistory.length,
          }));
        } catch (error) {
          console.error('Command execution failed:', error);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          setState(prev => ({
            ...prev,
            historyIndex: newIndex,
            currentInput: prev.commandHistory[newIndex] || '',
          }));
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (state.historyIndex < state.commandHistory.length) {
          const newIndex = state.historyIndex + 1;
          setState(prev => ({
            ...prev,
            historyIndex: newIndex,
            currentInput: prev.commandHistory[newIndex] || '',
          }));
        }
        break;

      default:
        break;
    }
  };

  return (
    <div className="terminal">
      <div className="terminal-prompt">$</div>
      <input
        ref={inputRef}
        type="text"
        className="terminal-input"
        value={state.currentInput}
        onChange={e => setState(prev => ({ ...prev, currentInput: e.target.value }))}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
};
