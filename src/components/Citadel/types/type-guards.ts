import { CommandNode, CommandResult, CommandArgument, CommandHandler } from './command-trie';

/**
 * Type guard to check if a value is a valid CommandResult
 */
export function isCommandResult(value: unknown): value is CommandResult {
  if (!value || typeof value !== 'object') return false;
  
  const result = value as CommandResult;
  if (result.json !== undefined && typeof result.json !== 'object') return false;
  if (result.text !== undefined && typeof result.text !== 'string') return false;
  
  return true;
}

/**
 * Type guard to check if a value is a valid CommandArgument
 */
export function isCommandArgument(value: unknown): value is CommandArgument {
  if (!value || typeof value !== 'object') return false;
  
  const arg = value as CommandArgument;
  return (
    typeof arg.name === 'string' &&
    typeof arg.description === 'string' &&
    arg.name.length > 0 &&
    arg.description.length > 0
  );
}

/**
 * Type guard to check if a value is a valid CommandHandler
 */
export function isCommandHandler(value: unknown): value is CommandHandler {
  return typeof value === 'function';
}

/**
 * Type guard to check if a value is a CommandNode instance
 */
export function isCommandNode(value: unknown): value is CommandNode {
  return value instanceof CommandNode;
}

/**
 * Type guard to check if a command node is a leaf node with a handler
 */
export function isExecutableCommand(node: CommandNode): boolean {
  return node.isLeaf && node.hasHandler;
}

/**
 * Type guard to check if a command result contains JSON data
 */
export function hasJsonResult(result: CommandResult): result is CommandResult & { json: NonNullable<CommandResult['json']> } {
  return result.json !== undefined;
}

/**
 * Type guard to check if a command result contains text output
 */
export function hasTextResult(result: CommandResult): result is CommandResult & { text: string } {
  return typeof result.text === 'string';
}

/**
 * Type guard to check if a command node requires an argument
 */
export function requiresArgument(node: CommandNode): node is CommandNode & { argument: CommandArgument } {
  return node.requiresArgument;
}
