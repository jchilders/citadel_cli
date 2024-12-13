import { CitadelConfig } from './types';

/**
 * Default configuration for Citadel command interface
 * 
 * @property commandTimeoutMs - The time in milliseconds before a command execution fails with a timeout. Default: 10000.
 * 
 * @property includeHelpCommand - When true, automatically adds a 'help' command that displays all available commands.
 *                               When false, no help command is included in the command trie. Default: true.
 * 
 * @property maxHeight - The maximum CSS height of the interface. Default: '80vh'.
 * 
 * @property resetStateOnHide - When true, hiding the interface (via Escape key or other means) will clear the command input.
 *                             When false, the interface preserves the last input when hidden. Default: false.
 * 
 * @property showCitadelKey - The keyboard key that shows the command interface. Default: '.' (period).
 */
export const defaultConfig: CitadelConfig = {
  commandTimeoutMs: 10000,
  includeHelpCommand: true,
  maxHeight: '80vh',
  resetStateOnHide: false,
  showCitadelKey: '.'
};
