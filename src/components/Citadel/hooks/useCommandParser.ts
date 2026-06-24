import { useCallback, useReducer } from 'react';
import { CommandNode, CommandSegment, ArgumentSegment, NullSegment, WordSegment } from '../types/command-registry';
import { CitadelState, CitadelActions } from '../types/state';
import { useCitadelCommands, useSegmentStack } from '../config/hooks';
import { useCitadelState } from './useCitadelState';
import { Logger } from '../utils/logger';
import { useCommandHistory } from './useCommandHistory';
import { inputStateReducer, type InputState } from '../core/input-state';
import { parseInput, stripSurroundingQuotes, type ParsedInput } from '../core/parse-input';
import {
  getNextExpectedSegment as coreGetNextExpectedSegment,
  getAvailableNodes as coreGetAvailableNodes,
  findMatchingCommands as coreFindMatchingCommands,
  getAutocompleteSuggestion as coreGetAutocompleteSuggestion,
  isValidCommandInput as coreIsValidCommandInput,
} from '../core/completion';

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

  const tryAutocomplete = useCallback((
    input: string
  ): CommandSegment => {
    Logger.debug("[tryAutoComplete] input: ", input);
    const suggestion = getAutocompleteSuggestion(input);
    
    if (!suggestion || suggestion.type === 'null') {
      return new NullSegment;
    }

    Logger.debug("[tryAutoComplete] result: ", suggestion);
    return suggestion;
  }, [getAutocompleteSuggestion]);

  /**
   * Handles autocompleting word segments, and saving argument values to the
   * segment stack.
   */
  const handleInputChange = useCallback((
    newValue: string,
    actions: CitadelActions,
  ) => {
    // Don't process input changes when navigating history
    if (state.history.position !== null) {
      return;
    }
    actions.setCurrentInput(newValue);
    Logger.debug("[useCommandParser][handleInputChange] newValue: ", newValue);

    const nextExpectedSegment = getNextExpectedSegment();
    const expectingArgument = nextExpectedSegment.type === 'argument' || inputState === 'entering_argument';

    if (expectingArgument) {
      const parsedInput = parseInput(newValue);
        
      if (parsedInput.isQuoted) {
        if (parsedInput.isComplete) { // `"hello"`
          if (!(nextExpectedSegment instanceof ArgumentSegment)) return;
          nextExpectedSegment.value = stripSurroundingQuotes(newValue);
          Logger.debug("[useCommandParser][handleInputChange][entering_command] pushing: ", nextExpectedSegment);
          segmentStack.push(nextExpectedSegment);
          actions.setCurrentInput('');
          setInputStateWithLogging('idle');

          return;
        } else { // `"hello`
          // User is still entering an argument. Do nothing
          return;
        }
      } else { // unquoted input, or a quoted argument whose closing quote was just typed
        if (parsedInput.isComplete) { // `hello ` or `"hello"`
          if (!(nextExpectedSegment instanceof ArgumentSegment)) return;
          nextExpectedSegment.value = stripSurroundingQuotes(newValue);
          Logger.debug("[useCommandParser][handleInputChange][entering_command] pushing: ", nextExpectedSegment);
          segmentStack.push(nextExpectedSegment);
          actions.setCurrentInput('');
          setInputStateWithLogging('idle');

          return;
        } else { // `hello`
          // User is still entering an argument. Do nothing
          return;
        }
      }
    }

    // If the user typed a delimiter after a word token, treat it as an explicit
    // selection for exact segment names (e.g. "example " should pick `example`
    // even if `examples` also exists).
    if (newValue.endsWith(' ')) {
      const token = newValue.trim().toLowerCase();
      const exactWordMatches = commands
        .getCompletions(segmentStack.path())
        .filter(
          (segment): segment is WordSegment =>
            segment.type === 'word' && segment.name.toLowerCase() === token
        );

      if (exactWordMatches.length === 1) {
        segmentStack.push(exactWordMatches[0]);
        actions.setCurrentInput('');
        setInputStateWithLogging('idle');
        return;
      }
    }

    const suggestedSegment = tryAutocomplete(newValue);
    if (suggestedSegment.type === 'word') {
      Logger.debug("[useCommandParser][handleInputChange][entering_command] pushing: ", suggestedSegment);
      segmentStack.push(suggestedSegment as WordSegment);
      actions.setCurrentInput('');
      setInputStateWithLogging('idle');

      return;
    }
  }, [tryAutocomplete, state, getNextExpectedSegment, inputState, segmentStack, commands]);

  const resetInputState = useCallback((actions: CitadelActions) => {
    actions.setCurrentInput('');
    actions.setIsEnteringArg(false);
    segmentStack.clear();
    setInputStateWithLogging('idle');
  }, [segmentStack]);

  /**
   * Handles keyboard events for Backspace, Enter, and regular input.
   * Responsible for:
   * - Command execution
   * - Navigation
   * Returns false if input was invalid and should trigger animation
   */
  const handleKeyDown = useCallback((
    e: KeyboardEvent | React.KeyboardEvent,
    state: CitadelState,
    actions: CitadelActions
  ): boolean | Promise<boolean> => {
    // Validate key input first
    const isValidKey = e.key === 'Backspace' || 
                       e.key === 'Enter' ||
                       e.key === 'ArrowUp' ||
                       e.key === 'ArrowDown' ||
                       e.key === 'ArrowLeft' ||
                       e.key === 'ArrowRight' ||
                       e.key === 'Escape' ||
                       e.key === 'Delete' ||
                       e.key === 'Home' ||
                       e.key === 'End' ||
                       e.key.length === 1;

    if (!isValidKey) {
      return true;
    }

    const { currentInput, isEnteringArg } = state;
    const parsedInput = parseInput(currentInput);

    // Handle special keys first
    switch (e.key) {
      case 'Backspace': {
        if (currentInput === '') {
          e.preventDefault();
          if (segmentStack.size() > 0) segmentStack.pop(); 
          setInputStateWithLogging('idle');
        }
        return true;
      }

      case 'Enter': {
        e.preventDefault();

        // Don't execute if quotes aren't closed
        if (parsedInput.isQuoted && !parsedInput.isComplete) {
          return true;
        }

        if (inputState === 'entering_argument' || (isEnteringArg && currentInput.trim())) {
          const nextSegment = getNextExpectedSegment();
          if (nextSegment instanceof ArgumentSegment) {
            nextSegment.value = stripSurroundingQuotes(currentInput);
            Logger.debug("[handleKeyDown][Enter]['entering_argument'] pushing: ", nextSegment);
            segmentStack.push(nextSegment);
          }
        }

        // Validate that we have a concrete command to execute
        const path = segmentStack.path();
        const command = commands.getCommand(path);
        if (!command) {
          // Command path incomplete; keep stack & input so user can continue typing
          return false;
        }

        // Validate that all required arguments are provided. Arguments fill in
        // order, so trailing optional ones may be omitted — their handlers
        // receive undefined and apply defaults.
        const requiredArgs = command.segments.filter(
          seg => seg.type === 'argument' && !(seg as ArgumentSegment).optional
        );
        const providedArgs = segmentStack.arguments;

        if (requiredArgs.length > providedArgs.length) {
          // Missing required arguments - trigger invalid input animation
          return false;
        }

        Logger.debug("[handleKeyDown][Enter] calling actions.executeCommand. segmentStack: ", segmentStack);
        actions.executeCommand();

        history.addStoredCommand(segmentStack.toArray());

        resetInputState(actions);

        return true;
      }

      case 'ArrowUp': {
        e.preventDefault();
        return (async () => {
          const navResult = await history.navigateHistory('up');
          if (navResult.segments) {
            segmentStack.clear();
            segmentStack.pushAll(navResult.segments);
            // Set current input to empty since all segments (including arguments) are in the stack
            actions.setCurrentInput('');
          }
          return true;
        })();
      }

      case 'ArrowDown': {
        e.preventDefault();
        return (async () => {
          const navResult = await history.navigateHistory('down');
          if (navResult.segments) {
            segmentStack.clear();
            segmentStack.pushAll(navResult.segments);
            // Set current input to empty since all segments (including arguments) are in the stack
            actions.setCurrentInput('');
          }
          return true;
        })();
      }

      default: {
        // Handle character input
        if (!isEnteringArg && e.key.length === 1) {
          const nextInput = (currentInput + e.key);
          if (!isValidCommandInput(nextInput)) {
            e.preventDefault();
            return false; // Invalid input - trigger animation
          }
        }
        return true;
      }
    }
  }, [
    inputState,
    isValidCommandInput,
    getNextExpectedSegment,
    history,
    resetInputState,
    commands,
    segmentStack,
  ]);

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
