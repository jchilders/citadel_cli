import { useCallback, useState } from 'react';
import { CommandNode, CommandTrie, CommandSegment, ArgumentSegment, NullSegment } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { useSegmentStack } from '../config/CitadelConfigContext';
import { useCitadelState } from './useCitadelState';
import { Logger } from '../utils/logger';

export type InputState = 'idle' | 'entering_command' | 'entering_argument';

interface UseCommandParserProps {
  commands: CommandTrie;
}

export const useCommandParser = ({ commands }: UseCommandParserProps) => {
  const { state } = useCitadelState();
  const segmentStack = useSegmentStack();
  const [inputState, setInputState] = useState<InputState>('idle');

  const setInputStateWithLogging = (newState: InputState) => {
    console.log(`InputState changing from ${inputState} to ${newState}`);
    setInputState(newState);
  }

  const getNextExpectedSegment = (): CommandSegment => {
    const completions = commands.getCompletions(segmentStack.path());
    const nextExpectedSegment = completions[0] || segmentStack.nullSegment; // Return first available completion
    console.log("[getNextExpectedSegment] ", nextExpectedSegment);
    return nextExpectedSegment;
  }

  const getAvailableNodes = useCallback((): CommandNode[] => {
    const nextSegmentNames = commands.getCompletions_s(segmentStack.path());
    return nextSegmentNames
      .map(segmentName => commands.getCommand([...segmentStack.path(), segmentName]))
      .filter((cmd): cmd is CommandNode => cmd !== undefined);
  }, [commands]);

  /**
   * Filters available commands to those that match the user's current input.
   * Used by AvailableCommands component to show command suggestions, and by
   * auto-completion logic to determine unique matches.
   * 
   * Example: If user types "us", this will "user" but not "unit"
   */
  const findMatchingCommands = useCallback((input: string, availableNodes: CommandNode[]): CommandNode[] => {
    if (!input) return availableNodes;
    
    const uniqueFirstSegments = availableNodes.reduce((acc, node) => {
      const segment = getNextExpectedSegment();
      if (segment?.type === 'word') {
        acc.set(segment.name, node);
      }
      return acc;
    }, new Map<string, CommandNode>());

    // Filter nodes whose next word segment matches the input
    const matches = Array.from(uniqueFirstSegments.values()).filter(_node => {
      const nextSegment = getNextExpectedSegment();
      if (nextSegment.type !== 'word') return false;
      return nextSegment.name.toLowerCase().startsWith(input.toLowerCase());
    });

    return matches;
  }, []);

  /**
   * Returns a completion suggestion when there's exactly one unambiguous match.
   * Used to auto-complete command words (not arguments) during typing.
   * 
   * Example: If available commands are ["user", "unit"] and input is "us",
   * returns "user". But if input is "u", returns null since it's ambiguous.
   */
  const getAutocompleteSuggestion = useCallback((input: string): CommandSegment => {
    console.log("[getAutocompleteSuggestion] >> input: ", input);
    // Get available word segments
    const availableSegments = commands.getCompletions(segmentStack.path())
      .filter(segment => segment.type === 'word');
    console.log("[getAutocompleteSuggestion] >> availableSegments: ", availableSegments);
    
    // Find segments that match the input
    const matchingSegments = availableSegments.filter(segment =>
      segment.name.toLowerCase().startsWith(input.toLowerCase())
    );
    console.log("[getAutocompleteSuggestion] >> matchingSegments: ", matchingSegments);
    
    // Only return a suggestion if we have exactly one match
    if (matchingSegments.length === 1) {
      return matchingSegments[0];
    }

    return segmentStack.nullSegment;
  }, [findMatchingCommands]);

  const isValidCommandInput = useCallback((input: ParsedInput): boolean => {
    if (!input.currentWord && !input.isQuoted) return true;

    const currentPath = segmentStack.path();
    const availableSegments = commands.getCompletions(currentPath);
    
    // If we have no completions and there's input, it's invalid
    if (availableSegments.length === 0 && input.currentWord) {
      return false;
    }

    // For arguments, any input is valid
    if (availableSegments.some(segment => segment.type === 'argument')) {
      return true;
    }

    // For word segments, check if input matches any available completion
    return availableSegments.some(segment =>
      segment.type === 'word' && 
      segment.name.toLowerCase().startsWith(input.currentWord.toLowerCase())
    );
  }, [commands]);

  const executeCommand = useCallback((
    actions: CitadelActions
  ) => {
    actions.executeCommand();
    resetInputState(actions);
  }, [segmentStack]);

  const tryAutocomplete = useCallback((
    parsedInput: ParsedInput
  ): CommandSegment => {
    console.log("[tryAutoComplete] parsedInput: ", parsedInput);
    const suggestion = getAutocompleteSuggestion(parsedInput.currentWord);
    console.log("[tryAutoComplete] currentWord: ", parsedInput.currentWord);
    console.log("[tryAutoComplete] suggestion: ", suggestion);
    
    if (!suggestion || suggestion.name === parsedInput.currentWord) {
      console.log("[tryAutoComplete] retuning NullSegment");
      return new NullSegment;
    }

    console.log("[tryAutoComplete] retuning ", suggestion);
    return suggestion;
  }, [getAvailableNodes, getAutocompleteSuggestion, segmentStack, commands, getNextExpectedSegment]);

  /**
   * Handles changes to the input text value (typing, pasting)
   * Responsible for:
   * - Parsing input into words/quotes
   * - Auto-completion
   */
  const handleInputChange = useCallback((
    newValue: string,
    actions: CitadelActions,
  ) => {
    console.log("[handleInputChange] inputState: ", inputState);
    console.log("[handleInputChange] newValue: ", newValue);

    actions.setCurrentInput(newValue);

    console.log("-=-=-=-=-=> segmentStack: ", segmentStack.toArray());

    const parsedInput = parseInput(newValue);
    console.log("-=-=-=-=-=> parsedInput: ", parsedInput);

    if (inputState == 'entering_argument') {
      console.log("-=-=-=-=-=> 1.2 entering_argument");
      if (parsedInput.isComplete) {
        console.log("-=-=-=-=-=> 1.2.1");
        
        // Get the next expected segment after completing the argument
        const nextSegment = getNextExpectedSegment();
        if (nextSegment.type !== 'null') {
          if (nextSegment.type === 'argument') {
            const argumentSegment = (nextSegment as ArgumentSegment);
            argumentSegment.value = parsedInput.words[0] ? parsedInput.words[0].trim() : '';
            console.log("-=-=-=-=-=> 1.2.1.1 pushing", argumentSegment);
            segmentStack.push(argumentSegment);
            setInputStateWithLogging('idle');
            actions.setCurrentInput('');

            return;
          } else {
            console.log("-=-=-=-=-=> 1.2.1.2 hmm. how? nextSegment: ", nextSegment);
          }
        }
      }

      return;
    }

    if (inputState == 'entering_command') {
      // Handle command input
      console.log("-=-=-=-=-=> 1.3 segmentStack: ", segmentStack.toArray());
      const suggestedSegment = tryAutocomplete(parsedInput);
      if (suggestedSegment.type == 'word') {
        console.log("-=-=-=-=-=> 1.3.1 pushing", suggestedSegment);
        segmentStack.push(suggestedSegment);
        actions.setCurrentInput('');

        setInputStateWithLogging('idle');
        return;
      } else {
        console.log("-=-=-=-=-=> 1.3.2 this shouldn't happen? suggestedSegment: ", suggestedSegment);
      }

      console.log("-=-=-=-=-=> 1.3 segmentStack after: ", segmentStack.toArray());
    }
  }, [tryAutocomplete, state]);

  /**
   * Handles keyboard events
   * Responsible for:
   * - Special key handling (Tab, Backspace, Enter)
   * - Command execution
   * - Navigation
   * - Input validation
   */
  const handleKeyDown = useCallback((
    e: KeyboardEvent | React.KeyboardEvent,
    state: CitadelState,
    actions: CitadelActions
  ) => {
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
      return;
    }
    Logger.debug('[handleKeyDown] ', { key: e.key, state });

    const { currentInput, isEnteringArg } = state;
    const parsedInput = parseInput(currentInput);

    // Handle special keys first
    switch (e.key) {
      case 'Backspace':
        console.log("[Backspace] before segmentStack: ", segmentStack);
        if (currentInput === '') {
          e.preventDefault();
          if (segmentStack.size() > 0) {
            const poppedSeg = segmentStack.pop();
            console.log("[Backspace] poppedSeg: ", poppedSeg);
          }
          setInputStateWithLogging('idle');
        }
        console.log("[Backspace] after segmentStack: ", segmentStack);
        return;

      case 'Enter':
        e.preventDefault();
        if (!parsedInput.isComplete) {
          // Don't execute if quotes aren't closed
          return;
        }

        // Trim any whitespace from input
        const trimmedInput = currentInput.trim();
        if (trimmedInput === '') {
          return;
        }

        if (isEnteringArg) {
          // Handle argument submission
          const args = [...parsedInput.words];
          if (parsedInput.currentWord) {
            args.push(parsedInput.currentWord);
          }
          executeCommand(actions);
        } else if (!isEnteringArg && parsedInput.currentWord) {
          // Try to match and execute a command
          const availableNodes = getAvailableNodes();
          const matches = findMatchingCommands(parsedInput.currentWord, availableNodes);
          
          if (matches.length === 1) {
            const matchedNode = matches[0];
            
            if (matchedNode.hasArguments) {
              actions.setCurrentInput('');
              actions.setIsEnteringArg(true);
              setInputStateWithLogging('entering_argument');
            } else {
              executeCommand(actions);
            }
          }
        } else if (!segmentStack.isEmpty()) {
          // Execute handler for current node if it doesn't need args
          executeCommand(actions);
        }
        return;
    }

    // Handle character input
    if (!isEnteringArg && e.key.length === 1) {
      const nextInput = parseInput(currentInput + e.key);
      if (!isValidCommandInput(nextInput)) {
        e.preventDefault();
        return;
      }
    }
  }, [
    commands,
    executeCommand,
    findMatchingCommands,
    getAvailableNodes,
    getAutocompleteSuggestion,
    isValidCommandInput
  ]);

  const resetInputState = useCallback((actions: CitadelActions) => {
    actions.setCurrentInput('');
    actions.setIsEnteringArg(false);
    segmentStack.clear();
    setInputStateWithLogging('idle');
  }, []);

  return {
    handleInputChange,
    handleKeyDown,
    executeCommand,
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

/* Parses command input into words, handling quoted strings and spaces.
 * Returns parsed words, current word being typed, and quote state.
 *
 * Example 1: Simple command with spaces
 *   const example1 = parseInput('git commit -m "initial commit');
 * Returns:
 *   {
 *     words: ['git', 'commit', '-m'],
 *     currentWord: 'initial commit',
 *     isQuoted: true,
 *     quoteChar: '"',
 *     isComplete: false
 *   }
 *
 * Example 2: Unfinished quoted string
 *   const example2 = parseInput('echo "hello world');
 * Returns:
 *   {
 *     words: ['echo'],
 *     currentWord: '"hello world',
 *     isQuoted: true,
 *     quoteChar: '"',
 *     isComplete: false
 *   }
 *
 * Example 3: Complete command with multiple words
 *   const example3 = parseInput('docker build -t my-image .');
 * Returns:
 *   {
 *     words: ['docker', 'build', '-t', 'my-image', '.'],
 *     currentWord: '',
 *     isQuoted: false,
 *     quoteChar: undefined,
 *     isComplete: true
 *   }
 */
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
