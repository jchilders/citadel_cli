import { CursorType } from '../types/cursor';
import { StorageConfig } from '../types/storage';

export interface CitadelConfig {
  /**
   * Configuration for command history storage
   */
  storage?: StorageConfig;
  /**
   * Whether to include the default help command in the command trie.
   */
  includeHelpCommand?: boolean;
  /**
   * Whether to reset the state when the interface is hidden (via Escape key or other means).
   */
  resetStateOnHide?: boolean;
  /**
   * The keyboard key that shows the command interface.
   */
  showCitadelKey?: string;
  /**
   * The time in milliseconds before a command execution fails with a timeout.
   */
  commandTimeoutMs?: number;
  /**
   * Optional CSS value for the maximum height of the command interface.
   * If provided, this value will be set as the `max-height` property of the interface.
   * 
   * Example:
   * ```
   * <Citadel config={{ maxHeight: '90vh' }} />
   * ```
   */
  maxHeight?: string;
  /**
   * The font size for the command output text.
   * Accepts Tailwind text size classes: 'text-xs', 'text-sm', 'text-base', 'text-lg', etc.
   */
  outputFontSize?: string;
  /**
   * The type of cursor to display. Can be one of 'blink', 'spin', 'solid', or 'bbs'.
   */
  cursorType?: CursorType;
  /**
   * The color of the cursor.
   * Accepts any valid CSS color value.
   */
  cursorColor?: string;
  /**
   * The speed of the cursor animation in milliseconds.
   * - For 'blink': Time between blinks (default: 530ms)
   * - For 'spin' and 'bbs': Time between frame changes (default: 120ms)
   * - For 'solid': Has no effect
   */
  cursorSpeed?: number;
}
