import { useCallback, useState } from 'react';
import { CommandNode, CommandTrie, CommandSegment, ArgumentSegment, NullSegment } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { useSegmentStack } from './useSegmentStack';

type InputState = 'idle' | 'entering_command' | 'entering_argument';

interface UseCommandParserProps {
  commands: CommandTrie;
}

export const useCommandParser = ({ commands }: UseCommandParserProps) => {
  const segmentStack = useSegmentStack();
  const [inputState, setInputState] = useState<InputState>('idle');

  function getNextExpectedSegment(path: string[]): CommandSegment {
    const segments = commands.getCompletions(path);
    return segments[0]; // Return first available completion
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
    
    // Get unique first segments from available nodes
    const uniqueFirstSegments = availableNodes.reduce((acc, node) => {
      const segment = getNextExpectedSegment(node.fullPath);
      if (segment?.type === 'word') {
        acc.set(segment.name, node);
      }
      return acc;
    }, new Map<string, CommandNode>());

    // Filter nodes whose next word segment matches the input
    const matches = Array.from(uniqueFirstSegments.values()).filter(node => {
      const nextSegment = getNextExpectedSegment(node.fullPath);
      if (!nextSegment || nextSegment.type !== 'word') return false;
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
    return new NullSegment;
  }, [findMatchingCommands]);

  const isValidCommandInput = useCallback((
    input: ParsedInput
  ): boolean => {
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
    commandStack: string[],
    actions: CitadelActions,
    args?: ArgumentSegment[]
  ) => {
    const node = commands.getCommand(commandStack);
    if (node?.handler) {
      actions.executeCommand(commandStack, args);
      resetInputState(actions);
    }
  }, [commands]);

  const tryAutoComplete = useCallback((
    parsedInput: ParsedInput,
    state: CitadelState,
    actions: CitadelActions
  ): boolean => {
    const suggestion = getAutocompleteSuggestion(parsedInput.currentWord);
    
    if (!suggestion || suggestion.name === parsedInput.currentWord) {
      return false;
    }

    segmentStack.push(suggestion);
    
    const newStack = [...state.commandStack, suggestion.name];
    actions.setCommandStack(newStack);
    actions.setCurrentInput('');
    
    const nextSegment = getNextExpectedSegment(newStack);
    if (nextSegment?.type === 'argument') {
      actions.setIsEnteringArg(true);
      setInputState('entering_argument');
    } else {
      actions.setIsEnteringArg(false);
      setInputState('idle');
    }

    return true;
  }, [getAvailableNodes, getAutocompleteSuggestion, commands, getNextExpectedSegment]);

  /**
   * Handles changes to the input text value (typing, pasting)
   * Responsible for:
   * - Parsing input into words/quotes
   * - Auto-completion
   * - Updating command/argument state
   */
  const handleInputChange = useCallback((
    newValue: string,
    state: CitadelState,
    actions: CitadelActions,
  ) => {
    const parsedInput = parseInput(newValue);
    actions.setCurrentInput(newValue);

    function nextSegmentIsArgument(): boolean {
      const nextSegment = getNextExpectedSegment(segmentStack.path())
      return nextSegment.type === 'argument';
    }

    // Handle quoted input differently
    if (parsedInput.isQuoted || nextSegmentIsArgument()) {
      actions.setIsEnteringArg(true);
      setInputState('entering_argument');
      return;
    }

    // Try auto-completion if we're not entering an argument
    if (!parsedInput.isQuoted && !state.isEnteringArg) {
      tryAutoComplete(parsedInput, state, actions);
    }

  }, [tryAutoComplete]);

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

    const { commandStack, currentInput, isEnteringArg } = state;
    const parsedInput = parseInput(currentInput);

    // Handle special keys first
    switch (e.key) {
      case 'Backspace':
        if (currentInput === '') {
          e.preventDefault();
          if (commandStack.length > 0) {
            const newStack = commandStack.slice(0, -1);
            
            actions.setCommandStack(newStack);
            actions.setIsEnteringArg(false);
            segmentStack.pop();
            setInputState('entering_command');
          }
        }
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
          executeCommand(commandStack, actions, args);
        } else if (!isEnteringArg && parsedInput.currentWord) {
          // Try to match and execute a command
          const availableNodes = getAvailableNodes();
          const matches = findMatchingCommands(parsedInput.currentWord, availableNodes);
          
          if (matches.length === 1) {
            const matchedNode = matches[0];
            const newStack = [...commandStack, matchedNode.segments[0].name];
            
            if (matchedNode.hasArguments) {
              actions.setCommandStack(newStack);
              actions.setCurrentInput('');
              actions.setIsEnteringArg(true);
              setInputState('entering_argument');
            } else {
              executeCommand(newStack, actions, undefined);
            }
          }
        } else if (currentNode && !currentNode.hasArguments) {
          // Execute handler for current node if it doesn't need args
          executeCommand(commandStack, actions, undefined);
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
    getAvailableNodes,
    getAutocompleteSuggestion,
    findMatchingCommands,
    executeCommand,
    commands,
    isValidCommandInput
  ]);

  const resetInputState = useCallback((actions: CitadelActions) => {
    actions.setCurrentInput('');
    actions.setIsEnteringArg(false);
    actions.setCommandStack([]);
    setInputState('idle');
  }, []);

  return {
    handleInputChange,
    handleKeyDown,
    executeCommand,
    inputState,
    // Expose internal functions for testing
    findMatchingCommands,
    getAutocompleteSuggestion,
    getAvailableNodes,
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
