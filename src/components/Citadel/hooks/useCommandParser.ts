import { useCallback, useState } from 'react';
import { CommandNode, CommandTrie, CommandSegment, ArgumentSegment } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { StoredCommand } from '../types/storage';

type InputState = 'idle' | 'entering_command' | 'entering_argument';

export interface ParsedInput {
  words: string[];
  currentWord: string;
  isQuoted: boolean;
  quoteChar?: "'" | '"';
  isComplete: boolean;
}

/*
 * Parses command input into words, handling quoted strings and spaces.
 * Returns parsed words, current word being typed, and quote state.
 *
 * Example 1: Simple command with spaces
 *   const example1 = parseInput('git commit -m "initial commit"');
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
 *     currentWord: 'hello world',
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

function getNextExpectedSegment(node: CommandNode | undefined, path: string[]): CommandSegment | undefined {
  if (!node) return undefined;
  const currentDepth = path.length;
  return node.segments[currentDepth];
}

interface UseCommandParserProps {
  commands: CommandTrie;
}

export function useCommandParser({ commands: commands }: UseCommandParserProps) {
  const [inputState, setInputState] = useState<InputState>('idle');

  const findMatchingCommands = useCallback((input: string, availableNodes: CommandNode[]): CommandNode[] => {
    if (!input) return availableNodes;
    return availableNodes.filter(node => {
      const nextSegment = getNextExpectedSegment(node, node.fullPath);
      if (!nextSegment) return false;
      return nextSegment.type === 'word' && 
             nextSegment.name.toLowerCase().startsWith(input.toLowerCase());
    });
  }, []);

  const getAutocompleteSuggestion = useCallback((input: string, availableNodes: CommandNode[]): string | null => {
    const matches = findMatchingCommands(input, availableNodes);
    if (matches.length === 1) {
      const nextSegment = getNextExpectedSegment(matches[0], matches[0].fullPath);
      return nextSegment?.type === 'word' ? nextSegment.name : null;
    }
    return null;
  }, [findMatchingCommands]);

  const getAvailableNodes = useCallback((currentNode?: CommandNode): CommandNode[] => {
    if (!currentNode) {
      return commands.commands;
    }
    const nextSegmentNames = commands.getCompletions_s(currentNode.fullPath);
    return nextSegmentNames
      .map(segmentName => commands.getCommand([...currentNode.fullPath, segmentName]))
      .filter((cmd): cmd is CommandNode => cmd !== undefined);
  }, [commands]);

  const isValidCommandInput = useCallback((
    input: ParsedInput, 
    currentNode?: CommandNode
  ): boolean => {
    if (!input.currentWord && !input.isQuoted) return true;
    
    if (currentNode) {
      const nextSegment = getNextExpectedSegment(currentNode, input.words);
      if (!nextSegment) return false;

      if (nextSegment.type === 'argument') {
        return true; // Arguments can be any value
      }

      // For word segments, check if it's a valid prefix
      return nextSegment.name.toLowerCase().startsWith(input.currentWord.toLowerCase());
    }

    // At root level, check if input matches any command prefix
    return commands.commands.some(cmd => 
      cmd.segments[0].name.toLowerCase().startsWith(input.currentWord.toLowerCase())
    );
  }, [commands]);

  const executeCommand = useCallback((
    commandStack: string[],
    actions: CitadelActions,
    args?: ArgumentSegment[]
  ) => {
    const node = commands.getCommand(commandStack);
    if (node) {
      actions.executeCommand(commandStack, args);
      actions.setCurrentInput('');
      actions.setIsEnteringArg(false);
      setInputState('idle');
    }
  }, [commands]);

  const handleInputChange = useCallback((
    newValue: string,
    state: CitadelState,
    actions: CitadelActions,
  ) => {
    const parsedInput = parseInput(newValue);
    const currentIndex = state.commandStack.length + (parsedInput.currentWord ? 1 : 0);
    actions.setCurrentInput(newValue);
    actions.setCurrentSegmentIndex(currentIndex);

    // Handle quoted input differently
    if (parsedInput.isQuoted) {
      actions.setIsEnteringArg(true);
      setInputState('entering_argument');
      return;
    }

    const nextSegment = getNextExpectedSegment(state.currentNode, parsedInput.words);
    if (!nextSegment) return;

    if (nextSegment.type === 'argument') {
      actions.setIsEnteringArg(true);
      setInputState('entering_argument');
      return;
    }

    // Only auto-complete for word segments
    if (nextSegment.type === 'word' && !parsedInput.isQuoted) {
      const availableNodes = getAvailableNodes(state.currentNode);
      const suggestion = getAutocompleteSuggestion(parsedInput.currentWord, availableNodes);
      
      if (suggestion && suggestion !== parsedInput.currentWord) {
        const newStack = [...state.commandStack, suggestion];
        const nextNode = commands.getCommand(newStack);
        
        if (nextNode) {
          actions.setCommandStack(newStack);
          const newInput = parsedInput.words.join(' ') + 
                          (parsedInput.words.length > 0 ? ' ' : '') + 
                          suggestion;
          actions.setCurrentInput(newInput);
          actions.setCurrentNode(nextNode);
          
          const nextNextSegment = getNextExpectedSegment(nextNode, newStack);
          if (nextNextSegment?.type === 'argument') {
            actions.setIsEnteringArg(true);
            setInputState('entering_argument');
          } else {
            actions.setIsEnteringArg(false);
            setInputState('idle');
          }
        }
      }
      actions.setCurrentSegmentIndex(parsedInput.words.length);
    }
  }, [getAvailableNodes, getAutocompleteSuggestion, commands]);

  const handleKeyDown = useCallback((
    e: KeyboardEvent,
    state: CitadelState,
    actions: CitadelActions
  ) => {
    const { commandStack, currentInput, isEnteringArg, currentNode } = state;
    const parsedInput = parseInput(currentInput);

    // Handle special keys first
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (!isEnteringArg && !parsedInput.isQuoted && parsedInput.currentWord) {
          const availableNodes = getAvailableNodes(currentNode);
          const suggestion = getAutocompleteSuggestion(parsedInput.currentWord, availableNodes);
          if (suggestion) {
            const newInput = parsedInput.words.join(' ') + 
                           (parsedInput.words.length > 0 ? ' ' : '') + 
                           suggestion;
            actions.setCurrentInput(newInput);
          }
        }
        return;

      case 'Backspace':
        if (currentInput === '') {
          e.preventDefault();
          if (commandStack.length > 0) {
            const newStack = commandStack.slice(0, -1);
            const prevNode = newStack.length > 0 ? commands.getCommand(newStack) : undefined;
            
            actions.setCommandStack(newStack);
            actions.setCurrentNode(prevNode);
            actions.setIsEnteringArg(false);
            setInputState('entering_command');
          }
        }
        return;

      case 'Enter':
        e.preventDefault();
        if (parsedInput.isQuoted) {
          // Don't execute if quotes aren't closed
          return;
        }

        if (isEnteringArg && currentNode?.handler) {
          // Handle argument submission
          const args = [...parsedInput.words];
          if (parsedInput.currentWord) {
            args.push(parsedInput.currentWord);
          }
          executeCommand(commandStack, actions, args);
        } else if (!isEnteringArg && parsedInput.currentWord) {
          // Try to match and execute a command
          const availableNodes = getAvailableNodes(currentNode);
          const matches = findMatchingCommands(parsedInput.currentWord, availableNodes);
          
          if (matches.length === 1) {
            const matchedNode = matches[0];
            const newStack = [...commandStack, matchedNode.segments[0].name];
            
            if (matchedNode.hasArguments) {
              actions.setCommandStack(newStack);
              actions.setCurrentNode(matchedNode);
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
    if (!isEnteringArg) {
      const nextInput = parseInput(currentInput + e.key);
      if (!isValidCommandInput(nextInput, currentNode)) {
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

  const replayCommand = useCallback(async (
    command: StoredCommand,
    state: CitadelState,
    actions: CitadelActions
  ) => {
    resetInputState(actions);
    
    let currentStack: string[] = [];
    let currentNode = undefined;

    for (const char of command.inputs) {
      const nextState = {
        ...state,
        commandStack: currentStack,
        currentNode: currentNode
      };

      if (currentNode?.argument) {
        actions.setIsEnteringArg(true);
        actions.setCurrentInput(char);
      } else {
        const suggestion = buildNextSuggestion(char, nextState);
        if (suggestion) {
          currentStack = [...currentStack, suggestion];
          actions.setCommandStack(currentStack);

          currentNode = commands.getCommand(currentStack);
          actions.setCurrentNode(currentNode);
        }
      }
    }
  }, [handleInputChange]);

  const resetInputState = useCallback((actions: CitadelActions) => {
    actions.setCurrentInput('');
    actions.setCommandStack([]);
    actions.setCurrentNode(undefined);
    actions.setIsEnteringArg(false);
  }, []);

  const buildNextSuggestion = (input: string, state: CitadelState): string => {
    const availableNodes = getAvailableNodes(state.currentNode);
    const suggestion = getAutocompleteSuggestion(input, availableNodes); 

    return suggestion || '';
  }

  return {
    handleInputChange,
    handleKeyDown,
    executeCommand,
    inputState,
    replayCommand,
    // Expose internal functions for testing
    findMatchingCommands,
    getAutocompleteSuggestion,
    getAvailableNodes,
    isValidCommandInput,
  };
}
