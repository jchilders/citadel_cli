import { CursorType } from '../types/cursor';
import { StorageConfig } from '../types/storage';
import { LogLevel } from '../utils/logger';

export interface CitadelConfig {
  /**
   * The time in milliseconds before a command execution fails with a timeout.
   */
  commandTimeoutMs?: number;

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

  /**
   * The type of cursor to display. Can be one of 'blink', 'spin', 'solid', or 'bbs'.
   */
  cursorType?: CursorType;

  /**
   * Whether to include the default help command in the command registry.
   */
  includeHelpCommand?: boolean;

  /**
   * The font family used by the interface.
   * Accepts any valid CSS `font-family` value.
   * Example: '"JetBrains Mono", monospace'
   */
  fontFamily?: string;

  /**
   * The default font size used by the interface.
   * Accepts either a CSS font-size value (e.g. '14px', '0.875rem')
   * or a Tailwind text size class (e.g. 'text-sm').
   */
  fontSize?: string;

  /**
   * The initial height of the command interface.
   * Accepts any valid CSS height value.
   * Example: '400px' or '50vh'
   */
  initialHeight?: string;

  /**
   * The log level for Citadel's logger
   * @default LogLevel.DEBUG in development, LogLevel.ERROR in production
   */
  logLevel?: LogLevel;

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

  minHeight?: string;

  /**
   * The font size for command output text.
   * Accepts either a CSS font-size value (e.g. '14px', '0.875rem')
   * or a Tailwind text size class (e.g. 'text-sm').
   * If omitted, output uses `fontSize`.
   */
  outputFontSize?: string;

  /**
   * Whether to reset the state when the interface is hidden (via Escape key or other means).
   */
  resetStateOnHide?: boolean;

  /**
   * The keyboard key that shows the command interface.
   */
  showCitadelKey?: string;

  /**
   * Presentation mode for rendering the Citadel interface.
   * - 'panel': Renders as an overlay panel anchored to the viewport bottom and toggled via keyboard shortcuts.
   * - 'inline': Renders directly within the host container and remains visible at all times.
   */
  displayMode?: 'panel' | 'inline';

  /**
   * Configuration for command history storage
   */
  storage?: StorageConfig;
}
