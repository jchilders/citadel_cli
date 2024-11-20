import React, { useEffect, useState } from 'react';
import { CursorStyle } from './types';

const spinChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

interface CursorProps {
  style?: CursorStyle;
}

export const Cursor: React.FC<CursorProps> = ({ 
  style = { type: 'blink', character: '▋', speed: 530 } 
}) => {
  const [visible, setVisible] = useState(true);
  const [spinIndex, setSpinIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (style.type === 'blink') {
        setVisible(v => !v);
      } else if (style.type === 'spin') {
        setSpinIndex(i => (i + 1) % spinChars.length);
      }
    }, style.speed || 530);

    return () => clearInterval(interval);
  }, [style.type, style.speed]);

  if (style.type === 'spin') {
    return <span className="command-cursor">{spinChars[spinIndex]}</span>;
  }

  if (style.type === 'solid') {
    return <span className="command-cursor">{style.character || '▋'}</span>;
  }

  return (
    <span className="command-cursor">
      {visible ? style.character || '▋' : ' '}
    </span>
  );
};