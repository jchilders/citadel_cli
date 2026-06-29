import { useCallback, useReducer } from 'react';
import { CommandNode, CommandSegment, ArgumentSegment } from '@citadel_cli/core';
import { CitadelState, CitadelActions } from '../types/state';
import { useCitadelCommands, useSegmentStack } from '../config/hooks';
import { useCitadelState } from './useCitadelState';
import { Logger } from '@citadel_cli/core';
import { useCommandHistory } from './useCommandHistory';
import { inputStateReducer, type InputState } from '@citadel_cli/core';
import { parseInput, stripSurroundingQuotes, type ParsedInput } from '@citadel_cli/core';
import {
  getNextExpectedSegment as coreGetNextExpectedSegment,
  getAvailableNodes as coreGetAvailableNodes,
  findMatchingCommands as coreFindMatchingCommands,
  getAutocompleteSuggestion as coreGetAutocompleteSuggestion,
  isValidCommandInput as coreIsValidCommandInput,
} from '@citadel_cli/core';
import {
  reduceInputChange,
  reduceKey,
  type AbstractKey,
  type Effect,
  type ParserState,
} from '@citadel_cli/core';

// Re-exported for existing consumers (CommandInput.tsx, tests) that import these
// from this module. The implementations now live in the framework-agnostic core
// (src/components/Citadel/core/); see CORE_EXTRACTION_DESIGN.md.
export { parseInput, stripSurroundingQuotes };
export type { InputState, ParsedInput };

export const useCommandParser = () => {
  const { state } = useCitadelState();
  const commands = useCitadelCommands();
  const history = useCommandHistory();
  const segmentStack = useSegmentStack();

  const [inputState, dispatch] = useReducer(inputStateReducer, 'idle');
  const setInputStateWithLogging = (newState: InputState) => {
    dispatch({ type: 'set', state: newState });
  }

  // These are thin React wrappers over the framework-agnostic core completion
  // queries (src/components/Citadel/core/completion.ts). They bind the shared
  // registry + segment-stack path so callers (and tests) keep the same
  // zero-argument / input-only signatures.
  const getNextExpectedSegment = useCallback((): CommandSegment =>
    coreGetNextExpectedSegment(commands, segmentStack.path(), segmentStack.nullSegment),
  [commands, segmentStack]);

  const getAvailableNodes = useCallback((): CommandNode[] =>
    coreGetAvailableNodes(commands, segmentStack.path()),
  [commands, segmentStack]);

  const findMatchingCommands = useCallback((input: string, availableNodes: CommandNode[]): CommandNode[] =>
    coreFindMatchingCommands(segmentStack.path(), input, availableNodes),
  [segmentStack]);

  const getAutocompleteSuggestion = useCallback((input: string): CommandSegment =>
    coreGetAutocompleteSuggestion(commands, segmentStack.path(), input, segmentStack.nullSegment),
  [commands, segmentStack]);

  const isValidCommandInput = useCallback((input: string): boolean =>
    coreIsValidCommandInput(commands, segmentStack.path(), input),
  [commands, segmentStack]);

  const resetInputState = useCallback((actions: CitadelActions) => {
    actions.setCurrentInput('');
    actions.setIsEnteringArg(false);
    segmentStack.clear();
    setInputStateWithLogging('idle');
  }, [segmentStack]);

  // Build the state snapshot the core controller reads from React/stack state.
  const snapshot = useCallback((current: CitadelState): ParserState => ({
    stack: segmentStack.toArray(),
    currentInput: current.currentInput,
    inputState,
    isEnteringArg: current.isEnteringArg,
    historyPosition: current.history.position,
  }), [segmentStack, inputState]);

  // Interpret the framework-agnostic effects from the core controller against
  // the shared segment stack, history service and React state. `historyNav` is
  // async and handled by handleKeyDown; every other effect applies
  // synchronously, in order.
  const applyEffects = useCallback((effects: Effect[], actions: CitadelActions) => {
    for (const effect of effects) {
      switch (effect.kind) {
        case 'setInput':
          actions.setCurrentInput(effect.value);
          break;
        case 'setInputState':
          setInputStateWithLogging(effect.state);
          break;
        case 'commitArgument': {
          const nextSegment = getNextExpectedSegment();
          if (nextSegment instanceof ArgumentSegment) {
            nextSegment.value = effect.value;
            Logger.debug('[useCommandParser][applyEffects][commitArgument] pushing: ', nextSegment);
            segmentStack.push(nextSegment);
          }
          break;
        }
        case 'pushSegment':
          Logger.debug('[useCommandParser][applyEffects][pushSegment] pushing: ', effect.segment);
          segmentStack.push(effect.segment);
          break;
        case 'popSegment':
          if (segmentStack.size() > 0) segmentStack.pop();
          break;
        case 'execute':
          Logger.debug('[useCommandParser][applyEffects][execute] segmentStack: ', segmentStack);
          actions.executeCommand();
          break;
        case 'addHistory':
          history.addStoredCommand(segmentStack.toArray());
          break;
        case 'resetInput':
          resetInputState(actions);
          break;
        case 'historyNav':
          // Async; handled by handleKeyDown.
          break;
      }
    }
  }, [getNextExpectedSegment, segmentStack, history, resetInputState]);

  /**
   * Handles autocompleting word segments and saving argument values to the
   * segment stack as the input field changes.
   */
  const handleInputChange = useCallback((
    newValue: string,
    actions: CitadelActions,
  ) => {
    const effects = reduceInputChange(snapshot(state), newValue, commands);
    applyEffects(effects, actions);
  }, [snapshot, state, commands, applyEffects]);

  /**
   * Handles keyboard events for Backspace, Enter, history navigation, and
   * command-input validation. Returns false if input was invalid and should
   * trigger the shake animation; returns a Promise for async history nav.
   */
  const handleKeyDown = useCallback((
    e: KeyboardEvent | React.KeyboardEvent,
    current: CitadelState,
    actions: CitadelActions
  ): boolean | Promise<boolean> => {
    const decision = reduceKey(snapshot(current), toAbstractKey(e), commands);

    if (decision.preventDefault) {
      e.preventDefault();
    }

    const navEffect = decision.effects.find(effect => effect.kind === 'historyNav');
    if (navEffect && navEffect.kind === 'historyNav') {
      return (async () => {
        const navResult = await history.navigateHistory(navEffect.dir);
        if (navResult.segments) {
          segmentStack.clear();
          segmentStack.pushAll(navResult.segments);
          // All segments (including arguments) are now in the stack.
          actions.setCurrentInput('');
        }
        return true;
      })();
    }

    applyEffects(decision.effects, actions);
    return decision.valid;
  }, [snapshot, commands, applyEffects, history, segmentStack]);

  return {
    handleInputChange,
    handleKeyDown,
    inputState,
    setInputStateWithLogging,
    // Expose internal functions for testing
    findMatchingCommands,
    getAutocompleteSuggestion,
    getAvailableNodes,
    getNextExpectedSegment,
    isValidCommandInput,
  };
}

/**
 * Maps a DOM keyboard event to the controller's framework-agnostic AbstractKey.
 * Keys other than Backspace/Enter/ArrowUp/ArrowDown are treated as a single
 * printable character (`char`) or an unhandled key (`other`).
 */
function toAbstractKey(e: KeyboardEvent | React.KeyboardEvent): AbstractKey {
  if (
    e.key === 'Backspace' ||
    e.key === 'Enter' ||
    e.key === 'ArrowUp' ||
    e.key === 'ArrowDown'
  ) {
    return { name: e.key };
  }
  if (e.key.length === 1) {
    return { name: 'char', char: e.key };
  }
  return { name: 'other' };
}
