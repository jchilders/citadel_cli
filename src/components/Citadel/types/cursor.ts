/** 
 * Defines the available cursor animation types.
 * - 'blink': Traditional blinking cursor
 * - 'spin': Spinning animation cursor
 * - 'solid': Static cursor
 * - 'bbs': BBS-style cursor
 */
export type CursorType = 'blink' | 'spin' | 'solid' | 'bbs';

/**
 * Configuration interface for cursor appearance and behavior
 */
export interface CursorStyle {
  /** The type of cursor animation */
  type: CursorType;
  /** The character to display as the cursor */
  character?: string;
  /** Animation speed in milliseconds */
  speed?: number;
  /** CSS color value for the cursor */
  color?: string;
}

/**
 * Default configurations for each cursor type
 * Provides complete configurations with all optional properties defined
 */
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