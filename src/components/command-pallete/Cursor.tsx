import React, { useEffect, useState } from 'react';
import { CursorStyle, DEFAULT_CURSOR_CONFIGS } from './types';

const spinChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const bbsChars = ['|', '/', '-', '\\'];

interface CursorProps {
  style?: Partial<CursorStyle> & Pick<CursorStyle, 'type'>;
}

export const Cursor: React.FC<CursorProps> = ({ style = { type: 'blink' } }) => {
  const config = {
    ...DEFAULT_CURSOR_CONFIGS[style.type],
    ...style
  };

  const [visible, setVisible] = useState(true);
  const [spinIndex, setSpinIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (config.type === 'blink') {
        setVisible(v => !v);
      } else if (['spin', 'bbs'].includes(config.type)) {
        setSpinIndex(i => (i + 1) % (config.type === 'bbs' ? bbsChars.length : spinChars.length));
      }
    }, config.speed);

    return () => clearInterval(interval);
  }, [config.type, config.speed]);

  const cursorStyle = {
    color: config.color
  };

  if (['spin', 'bbs'].includes(config.type)) {
    const chars = config.type === 'bbs' ? bbsChars : spinChars;
    return <span className="command-cursor" style={cursorStyle}>{chars[spinIndex]}</span>;
  }

  if (config.type === 'solid') {
    return <span className="command-cursor" style={cursorStyle}>{config.character}</span>;
  }

  return (
    <span className="command-cursor" style={cursorStyle}>
      {visible ? config.character : ' '}
    </span>
  );
};