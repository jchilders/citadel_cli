import { useCallback, useReducer } from 'react';
import { CommandNode, CommandSegment, ArgumentSegment, NullSegment, WordSegment } from '../types/command-registry';
import { CitadelState, CitadelActions } from '../types/state';
import { useCitadelCommands, useSegmentStack } from '../config/hooks';
import { useCitadelState } from './useCitadelState';
import { Logger } from '../utils/logger';
import { useCommandHistory } from './useCommandHistory';

export type InputState = 'idle' | 'entering_command' | 'entering_argument';

type InputStateAction = {
  type: 'set';
  state: InputState;
};

function inputStateReducer(state: InputState, action: InputStateAction): InputState {
  switch (action.type) {
    case 'set':
      Logger.debug(`[inputStateReducer] InputState changing from ${state} to ${action.state}`);
      return action.state;
    default:
      return state;
  }
}

export const useCommandParser = () => {
  const { state } = useCitadelState();
  const commands = useCitadelCommands();
  const history = useCommandHistory();
  const segmentStack = useSegmentStack();

  const [inputState, dispatch] = useReducer(inputStateReducer, 'idle');
  const setInputStateWithLogging = (newState: InputState) => {
    dispatch({ type: 'set', state: newState });
  }

  const getNextExpectedSegment = useCallback((): CommandSegment => {
    const completions = commands.getCompletions(segmentStack.path());
    const nextExpectedSegment = completions[0] || segmentStack.nullSegment; // Return first available completion
    Logger.debug("[getNextExpectedSegment] ", nextExpectedSegment);
    return nextExpectedSegment;
  }, [commands, segmentStack]);

  const getAvailableNodes = useCallback((): CommandNode[] => {
    const nextSegmentNames = commands.getCompletionNames(segmentStack.path());
    return nextSegmentNames
      .map(segmentName => commands.getCommand([...segmentStack.path(), segmentName]))
      .filter((cmd): cmd is CommandNode => cmd !== undefined);
  }, [commands, segmentStack]);

  /**
   * Filters available commands to those that match the user's current input.
   * Used by AvailableCommands component to show command suggestions, and by
   * auto-completion logic to determine unique matches.
   * 
   * Example: If user types "us", this will "user" but not "unit"
   */
  const findMatchingCommands = useCallback((input: string, availableNodes: CommandNode[]): CommandNode[] => {
    if (!input) return availableNodes;

    const depth = segmentStack.path().length;
    return availableNodes.filter(node => {
      const segment = node.segments[depth];
      if (!segment || segment.type !== 'word') return false;
      return segment.name.toLowerCase().startsWith(input.toLowerCase());
    });
  }, [segmentStack]);

  /**
   * Returns a completion suggestion when there's exactly one unambiguous match.
   * Used to auto-complete command words (not arguments) during typing.
   * 
   * Example: If available commands are ["user", "unit"] and input is "us",
   * returns "user". But if input is "u", returns null since it's ambiguous.
   */
  const getAutocompleteSuggestion = useCallback((input: string): CommandSegment => {
    // Get available word segments
    const availableSegments = commands.getCompletions(segmentStack.path())
      .filter(segment => segment.type === 'word');
    
    // Find segments that match the input
    const matchingSegments = availableSegments.filter(segment =>
      segment.name.toLowerCase().startsWith(input.toLowerCase())
    );
    
    // Only return a suggestion if we have exactly one match
    if (matchingSegments.length === 1) {
      return matchingSegments[0];
    }

    return segmentStack.nullSegment;
  }, [commands, segmentStack]);

  const isValidCommandInput = useCallback((input: string): boolean => {
    const currentPath = segmentStack.path();
    const availableSegments = commands.getCompletions(currentPath);
    
    // If we have no completions and there's input, it's invalid
    if (availableSegments.length === 0 && input) {
      return false;
    }

    // For arguments, any input is valid
    if (availableSegments.some(segment => segment.type === 'argument')) {
      return true;
    }

    // For word segments, check if input matches any available completion
    const isValid = availableSegments.some(segment =>
      segment.type === 'word' && 
      segment.name.toLowerCase().startsWith(input.toLowerCase())
    );
    
    return isValid;
  }, [commands, segmentStack]);

  const tryAutocomplete = useCallback((
    input: string
  ): CommandSegment => {
    Logger.debug("[tryAutoComplete] input: ", input);
    const suggestion = getAutocompleteSuggestion(input);
    
    if (!suggestion || suggestion.name === input) {
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

    if (inputState === 'entering_argument') {
      const parsedInput = parseInput(newValue);
        
      if (parsedInput.isQuoted) {
        if (parsedInput.isComplete) { // `"hello"`
          const nextSegment = getNextExpectedSegment();
          if (!(nextSegment instanceof ArgumentSegment)) return;
          nextSegment.value = newValue.trim() || '';
          Logger.debug("[useCommandParser][handleInputChange][entering_command] pushing: ", nextSegment);
          segmentStack.push(nextSegment);
          actions.setCurrentInput('');
          setInputStateWithLogging('idle');

          return;
        } else { // `"hello`
          // User is still entering an argument. Do nothing
          return;
        }
      } else { // unquoted input
        if (parsedInput.isComplete) { // `hello `
          const nextSegment = getNextExpectedSegment();
          if (!(nextSegment instanceof ArgumentSegment)) return;
          nextSegment.value = newValue.trim() || '';
          Logger.debug("[useCommandParser][handleInputChange][entering_command] pushing: ", nextSegment);
          segmentStack.push(nextSegment);
          actions.setCurrentInput('');
          setInputStateWithLogging('idle');

          return;
        } else { // `hello`
          // User is still entering an argument. Do nothing
          return;
        }
      }
    }

    if (inputState === 'entering_command') {
      const suggestedSegment = tryAutocomplete(newValue);
      if (suggestedSegment.type === 'word') {
        Logger.debug("[useCommandParser][handleInputChange][entering_command] pushing: ", suggestedSegment);
        segmentStack.push(suggestedSegment as WordSegment);
        actions.setCurrentInput('');
        setInputStateWithLogging('idle');

        return;
      }
    }
  }, [tryAutocomplete, state, getNextExpectedSegment, inputState, segmentStack]);

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
            nextSegment.value = currentInput;
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

        // Validate that all required arguments are provided
        const requiredArgs = command.segments.filter(seg => seg.type === 'argument');
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


export interface ParsedInput {
  words: string[];
  currentWord: string;
  isQuoted: boolean;
  quoteChar?: "'" | '"';
  isComplete: boolean;
}

export function parseInput(input: string): ParsedInput {
  const words: string[] = [];
  let currentWord = '';
  let isQuoted = false;
  let quoteChar: "'" | '"' | undefined;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if ((char === '"' || char === "'") && (!isQuoted || char === quoteChar)) {
      if (isQuoted) {
        // End quote
        words.push(currentWord);
        currentWord = '';
        isQuoted = false;
        quoteChar = undefined;
      } else {
        // Start quote
        if (currentWord) {
          words.push(currentWord);
          currentWord = '';
        }
        isQuoted = true;
        quoteChar = char;
      }
    } else if (!isQuoted && char === ' ') {
      if (currentWord) {
        words.push(currentWord);
        currentWord = '';
      }
    } else {
      currentWord += char;
    }
  }

  return {
    words,
    currentWord,
    isQuoted,
    quoteChar,
    isComplete: !isQuoted && !currentWord
  };
}
