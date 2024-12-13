import React, { useEffect, useState, useMemo } from 'react';
import { CursorStyle, DEFAULT_CURSOR_CONFIGS } from './types/cursor';

const spinChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const bbsChars = ['|', '/', '-', '\\'];

interface CursorProps {
  style?: Partial<CursorStyle> & Pick<CursorStyle, 'type'>;
  isValid?: boolean;
  errorMessage?: string;
}

export const Cursor: React.FC<CursorProps> = ({
  style = { type: 'blink' },
  isValid = true,
  errorMessage,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_CURSOR_CONFIGS[style.type],
    ...style
  }), [style]);

  const [visible, setVisible] = useState(true);
  const [spinIndex, setSpinIndex] = useState(0);

  useEffect(() => {
    if (config.speed === 0) return;

    const interval = setInterval(() => {
      if (config.type === 'blink') {
        setVisible(v => !v);
      } else if (['spin', 'bbs'].includes(config.type)) {
        setSpinIndex(i => (i + 1) % (config.type === 'bbs' ? bbsChars.length : spinChars.length));
      }
    }, config.speed);

    return () => clearInterval(interval);
  }, [config.type, config.speed]);

  const cursorStyle = useMemo(() => ({
    color: isValid ? config.color : '#ff4444',
    transition: 'color 0.15s ease-in-out'
  }), [isValid, config.color]);

  const renderCursor = () => {
    if (!isValid && errorMessage) {
      return '✗';
    }

    if (['spin', 'bbs'].includes(config.type)) {
      const chars = config.type === 'bbs' ? bbsChars : spinChars;
      return chars[spinIndex];
    }
    
    if (config.type === 'solid') {
      return config.character;
    }
    
    return visible ? config.character : ' ';
  };

  return (
    <div className="relative inline-block">
      <span 
        className={`command-cursor ${!isValid ? 'animate-shake' : ''}`} 
        style={cursorStyle}
        title={errorMessage}
      >
        {renderCursor()}
      </span>
    </div>
  );
};