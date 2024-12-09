import { CitadelConfig } from './types';

/**
 * Default configuration for Citadel command interface
 * 
 * @property resetStateOnHide - When true, hiding the interface (via Escape key or other means) will clear the command input.
 *                             When false, the interface preserves the last input when hidden.
 * 
 * @property showCitadelKey - The keyboard key that shows the command interface. Default is '.' (period).
 *                           When pressed, the interface becomes visible and ready for command input.
 * 
 * @property includeHelpCommand - When true, automatically adds a 'help' command that displays all available commands.
 *                               When false, no help command is included in the command trie.
 */
export const defaultConfig: CitadelConfig = {
  resetStateOnHide: false,
  showCitadelKey: '.',
  includeHelpCommand: true
};
