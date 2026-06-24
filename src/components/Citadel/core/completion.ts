/**
 * Framework-agnostic command-completion queries.
 *
 * Part of the Citadel core: pure functions of `(registry, path, input)` with no
 * React or DOM dependency, shared between the web (React) and terminal (CLI)
 * front-ends. Extracted verbatim from the `useCommandParser` closures. See
 * CORE_EXTRACTION_DESIGN.md.
 *
 * The null sentinel is injected (`nullSegment`) rather than constructed here, so
 * callers that compare against their own shared `NullSegment` instance by
 * identity keep working.
 */
import { CommandNode, CommandSegment, CommandRegistry } from '../types/command-registry';
import { Logger } from '../utils/logger';

/**
 * Returns the first available completion for the current path, or the injected
 * null sentinel when there are none.
 */
export function getNextExpectedSegment(
  registry: CommandRegistry,
  path: string[],
  nullSegment: CommandSegment,
): CommandSegment {
  const completions = registry.getCompletions(path);
  const nextExpectedSegment = completions[0] || nullSegment; // Return first available completion
  Logger.debug('[getNextExpectedSegment] ', nextExpectedSegment);
  return nextExpectedSegment;
}

/**
 * Resolves the concrete command nodes reachable from the current path.
 */
export function getAvailableNodes(
  registry: CommandRegistry,
  path: string[],
): CommandNode[] {
  const nextSegmentNames = registry.getCompletionNames(path);
  return nextSegmentNames
    .map(segmentName => registry.getCommand([...path, segmentName]))
    .filter((cmd): cmd is CommandNode => cmd !== undefined);
}

/**
 * Filters available commands to those whose word segment at the current depth
 * matches the user's input. Used to show command suggestions and to determine
 * unique matches for auto-completion.
 *
 * Example: input "us" matches "user" but not "unit".
 */
export function findMatchingCommands(
  path: string[],
  input: string,
  availableNodes: CommandNode[],
): CommandNode[] {
  if (!input) return availableNodes;

  const depth = path.length;
  return availableNodes.filter(node => {
    const segment = node.segments[depth];
    if (!segment || segment.type !== 'word') return false;
    return segment.name.toLowerCase().startsWith(input.toLowerCase());
  });
}

/**
 * Returns a word completion when there is exactly one unambiguous match,
 * otherwise the injected null sentinel.
 *
 * Example: available ["user", "unit"] + input "us" → "user"; input "u" → null.
 */
export function getAutocompleteSuggestion(
  registry: CommandRegistry,
  path: string[],
  input: string,
  nullSegment: CommandSegment,
): CommandSegment {
  const uniqueMatch = registry.getUniqueCompletion(path, input);
  if (uniqueMatch && uniqueMatch.type === 'word') {
    return uniqueMatch;
  }
  return nullSegment;
}

/**
 * Returns true when `input` is a valid continuation of the current command path
 * (matches an available word completion, or any input while expecting an
 * argument).
 */
export function isValidCommandInput(
  registry: CommandRegistry,
  path: string[],
  input: string,
): boolean {
  const availableSegments = registry.getCompletions(path);

  // If we have no completions and there's input, it's invalid
  if (availableSegments.length === 0 && input) {
    return false;
  }

  // For arguments, any input is valid
  if (availableSegments.some(segment => segment.type === 'argument')) {
    return true;
  }

  // For word segments, check if input matches any available completion
  return registry.getMatchingCompletions(path, input)
    .some((segment) => segment.type === 'word');
}
