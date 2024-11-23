export type CursorType = 'blink' | 'spin' | 'solid' | 'bbs';

export interface CursorStyle {
  type: CursorType;
  character?: string;
  speed?: number;
  color?: string;
}

export const DEFAULT_CURSOR_CONFIGS: Record<CursorType, Required<Omit<CursorStyle, 'type'>>> = {
  blink: {
    character: '▋',
    speed: 530,
    color: '#fff'
  },
  spin: {
    character: '⠋',
    speed: 120,
    color: '#fff'
  },
  solid: {
    character: '▋',
    speed: 0,
    color: '#fff'
  },
  bbs: {
    character: '|',
    speed: 120,
    color: '#fff'
  }
} as const;