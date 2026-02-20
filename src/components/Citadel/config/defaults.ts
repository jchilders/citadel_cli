import { CitadelConfig } from './types';
import { LogLevel } from '../utils/logger';

const isProduction = import.meta.env.PROD;

/**
 * Default configuration for Citadel command interface
 * 
 * @property commandTimeoutMs - The time in milliseconds before a command execution fails with a timeout. Default: 10000.
 * 
 * @property cursorColor - The color of the cursor. Default: 'var(--cursor-color, #fff)'.
 * 
 * @property cursorSpeed - The speed of cursor animation in milliseconds. Default varies by cursor type:
 *                        blink: 530ms, spin/bbs: 120ms, solid: N/A
 * 
 * @property cursorType - The type of cursor animation to display. Can be one of 'blink', 'spin', 'solid', or 'bbs'. Default: 'bbs'.
 * 
 * @property includeHelpCommand - When true, automatically adds a 'help' command that displays all available commands.
 *                               When false, no help command will be shown. Default: true.
 * 
 * @property fontFamily - The font family used by the interface. Default: 'monospace'.
 * 
 * @property fontSize - The default font size used by the interface. Default: '0.875rem'.
 * 
 * @property initialHeight - The initial CSS height of the interface. Default: '40vh'.
 * 
 * @property logLevel - The logging level for the Citadel interface. Default: DEBUG in development, ERROR in production.
 * 
 * @property maxHeight - The maximum CSS height of the interface. Default: '80vh'.
 * 
 * @property minHeight - The minimum CSS height of the interface. Default: '200'.
 * 
 * @property outputFontSize - The output font size as CSS value or Tailwind text size class. Default: '0.875rem'.
 * 
 * @property resetStateOnHide - When true, hiding the interface (via Escape key or other means) will clear the command input.
 *                             When false, the interface preserves the last input when hidden. Default: false.
 * 
 * @property showCitadelKey - The keyboard key that shows the command interface. Default: '.' (period).
 * 
 * @property storage - Configuration for command history storage. Default: { type: 'localStorage', maxCommands: 100 }.
 */
export const defaultConfig: CitadelConfig = {
  commandTimeoutMs: 10000,
  cursorColor: 'var(--cursor-color, #fff)',
  cursorSpeed: 530,
  cursorType: 'blink',
  includeHelpCommand: true,
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  initialHeight: '40vh',
  logLevel: isProduction ? LogLevel.ERROR : LogLevel.DEBUG,
  maxHeight: '80vh',
  minHeight: '200',
  outputFontSize: '0.875rem',
  resetStateOnHide: false,
  showCitadelKey: '.',
  displayMode: 'panel',
  storage: {
    type: 'localStorage',
    maxCommands: 100
  }
};
