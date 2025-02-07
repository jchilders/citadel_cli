import { useCallback, useState } from 'react';
import { CommandNode, CommandTrie, CommandSegment, ArgumentSegment, NullSegment, WordSegment } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { useSegmentStack } from '../config/CitadelConfigContext';
import { useCitadelState } from './useCitadelState';
import { Logger } from '../utils/logger';
import { useSegmentStackVersion } from './useSegmentStackVersion';

export type InputState = 'idle' | 'entering_command' | 'entering_argument';

interface UseCommandParserProps {
  commands: CommandTrie;
}

export const useCommandParser = ({ commands }: UseCommandParserProps) => {
  const { state } = useCitadelState();
  const segmentStack = useSegmentStack();
  const segmentStackVersion = useSegmentStackVersion();
  const [inputState, setInputState] = useState<InputState>('idle');

  const setInputStateWithLogging = (newState: InputState) => {
    Logger.debug(`InputState changing from ${inputState} to ${newState}`);
    setInputState(newState);
  }

  const getNextExpectedSegment = (): CommandSegment => {
    const completions = commands.getCompletions(segmentStack.path());
    const nextExpectedSegment = completions[0] || segmentStack.nullSegment; // Return first available completion
    Logger.debug("[getNextExpectedSegment] ", nextExpectedSegment);
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

  const tryAutocomplete = useCallback((
    parsedInput: ParsedInput
  ): CommandSegment => {
    const suggestion = getAutocompleteSuggestion(parsedInput.currentWord);
    
    if (!suggestion || suggestion.name === parsedInput.currentWord) {
      return new NullSegment;
    }

    Logger.debug("[tryAutoComplete] result: ", suggestion);
    return suggestion;
  }, [getAvailableNodes, getAutocompleteSuggestion, segmentStack, commands, getNextExpectedSegment]);

  /**
   * Handles autocompleting word segments, and saving the values for argument
   * segments to the segment stack.
   */
  const handleInputChange = useCallback((
    newValue: string,
    actions: CitadelActions,
  ) => {
    actions.setCurrentInput(newValue);
    const parsedInput = parseInput(newValue);

    if (inputState === 'entering_argument') {
      if (!parsedInput.isComplete) return; 
        
      const nextSegment = getNextExpectedSegment();
      if (nextSegment.type === 'argument') {
        Logger.debug("[useCommandParser][handleInputChange][entering_argument] nextSegment: ", nextSegment);
        const argumentSegment = (nextSegment as ArgumentSegment);
        argumentSegment.value = parsedInput.words[0]?.trim() || '';
        segmentStack.push(argumentSegment);
        actions.setCurrentInput('');
        setInputStateWithLogging('idle');

        return;
      }
    }

    if (inputState == 'entering_command') {
      const suggestedSegment = tryAutocomplete(parsedInput);
      if (suggestedSegment.type === 'word') {
        Logger.debug("[useCommandParser][handleInputChange][entering_command] suggestedSegment: ", suggestedSegment);
        segmentStack.push(suggestedSegment as WordSegment);
        actions.setCurrentInput('');
        setInputStateWithLogging('idle');

        return;
      }
    }
  }, [tryAutocomplete, segmentStackVersion, state]);

  /**
   * Handles keyboard events for Backspace, Enter, and regular input.
   * Responsible for:
   * - Command execution
   * - Navigation
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

    // Handle special keys first
    switch (e.key) {
      case 'Backspace':
        if (currentInput === '') {
          e.preventDefault();
          if (segmentStack.size() > 0) segmentStack.pop(); 
          setInputStateWithLogging('idle');
        }
        return;

      case 'Enter':
        e.preventDefault();

        const parsedInput = parseInput(currentInput);
        // Don't execute if quotes aren't closed
        if (parsedInput.isQuoted && !parsedInput.isComplete) {
          return;
        }

        if (inputState === 'entering_argument') {
          const nextSegment = getNextExpectedSegment();
          const argumentSegment = (nextSegment as ArgumentSegment);
          argumentSegment.value = parsedInput.words[0]?.trim() || '';
          segmentStack.push(argumentSegment);
        }

        Logger.debug("[handleKeyDown][Enter] calling executeCommand. segmentStack: ", segmentStack);
        actions.executeCommand();
        resetInputState(actions);

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
    findMatchingCommands,
    getAvailableNodes,
    getAutocompleteSuggestion,
    inputState,
    isValidCommandInput,
    segmentStackVersion,
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
