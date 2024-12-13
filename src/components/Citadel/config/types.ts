export interface CitadelConfig {
  /**
   * Whether to include the default help command in the command trie.
   */
  includeHelpCommand?: boolean;
  /**
   * Whether to reset the state when the interface is hidden (via Escape key or other means).
   */
  resetStateOnHide?: boolean;
  /**
   * The keyboard key that shows the command interface. Default is '.' (period).
   */
  showCitadelKey?: string;
  /**
   * The time in milliseconds before a command execution fails with a timeout. Default is 10000 (10 seconds).
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
}
