import { useCallback, useState } from 'react';
import { CommandNode, CommandTrie } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';
import { useCommandTrie } from './useCommandTrie';
import { StoredCommand } from '../types/storage';

type InputState = 'idle' | 'entering_command' | 'entering_argument';

interface UseCommandParserProps {
  commandTrie?: CommandTrie;
}

export function useCommandParser({ commandTrie: propsTrie }: UseCommandParserProps = {}) {
  const [inputState, setInputState] = useState<InputState>('idle');
  const defaultTrie = useCommandTrie();
  const commandTrie = propsTrie || defaultTrie;

  const findMatchingCommands = useCallback((input: string, availableNodes: CommandNode[]): CommandNode[] => {
    if (!input) return availableNodes;
    return availableNodes.filter(node => node.name.toLowerCase().startsWith(input.toLowerCase()));
  }, []);

  const getAutocompleteSuggestion = useCallback((input: string, availableNodes: CommandNode[]): string | null => {
    const matches = findMatchingCommands(input, availableNodes);
    if (matches.length === 1) {
      return matches[0].name;
    }
    return null;
  }, [findMatchingCommands]);

  const getAvailableNodes = useCallback((currentNode?: CommandNode): CommandNode[] => {
    if (currentNode?.hasChildren) {
      return Array.from(currentNode.children.values());
    }
    return commandTrie.getRootCommands();
  }, [commandTrie]);

  const isValidCommandInput = useCallback((input: string, availableNodes: CommandNode[]): boolean => {
    const matches = findMatchingCommands(input, availableNodes);
    return matches.length > 0;
  }, [findMatchingCommands]);

  const executeCommand = useCallback((
    commandStack: string[],
    actions: CitadelActions,
    args?: string[]
  ) => {
    const node = commandTrie.getCommand(commandStack);
    if (node) {
      actions.executeCommand(commandStack, args || undefined);
      actions.setCurrentInput('');
      actions.setIsEnteringArg(false);
      setInputState('idle');
    }
  }, [commandTrie]);

  const handleInputChange = useCallback((
    newValue: string,
    state: CitadelState,
    actions: CitadelActions
  ) => {
    actions.setCurrentInput(newValue);

    // Only auto-complete if we're not entering an argument
    if (!state.isEnteringArg) {
      const words = newValue.trim().split(/\s+/);
      const currentWord = words[words.length - 1] || '';
      const availableNodes = getAvailableNodes(state.currentNode);
      const suggestion = getAutocompleteSuggestion(currentWord, availableNodes);
      
      if (suggestion && suggestion !== currentWord) {
        const newStack = [...state.commandStack, suggestion];
        const nextNode = commandTrie.getCommand(newStack);
        
        if (nextNode) {
          actions.setCommandStack(newStack);
          actions.setCurrentInput(words.slice(0, -1).join(' ') + (words.length > 1 ? ' ' : '') + suggestion);
          actions.setCurrentNode(nextNode);
          
          // If this is a leaf node with arguments, enter argument mode
          if (!nextNode.hasChildren && nextNode.arguments.length > 0) {
            actions.setIsEnteringArg(true);
            setInputState('entering_argument');
          } else {
            actions.setIsEnteringArg(false);
            setInputState('idle');
          }
        }
      }
    }
  }, [getAvailableNodes, getAutocompleteSuggestion, commandTrie]);

  const handleKeyDown = useCallback((
    e: KeyboardEvent,
    state: CitadelState,
    actions: CitadelActions
  ) => {
    const { commandStack, currentInput, isEnteringArg, currentNode } = state;

    // Handle special keys first
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (!isEnteringArg && currentInput) {
          const availableNodes = getAvailableNodes(currentNode);
          const suggestion = getAutocompleteSuggestion(currentInput, availableNodes);
          if (suggestion) {
            actions.setCurrentInput(suggestion);
          }
        }
        return;

      case 'Backspace':
        if (currentInput === '') {
          e.preventDefault();
          if (commandStack.length > 0) {
            const newStack = commandStack.slice(0, -1);
            const prevNode = newStack.length > 0 ? commandTrie.getCommand(newStack) : undefined;
            
            actions.setCommandStack(newStack);
            actions.setCurrentNode(prevNode);
            actions.setIsEnteringArg(false);
            setInputState('entering_command');
          }
        }
        return;

      case 'Enter':
        e.preventDefault();
        if (isEnteringArg && currentNode?.handler) {
          if (currentInput.trim()) {
            executeCommand(commandStack, actions, [currentInput.trim()]);
          }
        } else if (!isEnteringArg && currentInput) {
          const availableNodes = getAvailableNodes(currentNode);
          const matches = findMatchingCommands(currentInput, availableNodes);
          
          if (matches.length === 1) {
            const matchedNode = matches[0];
            const newStack = [...commandStack, matchedNode.name];
            
            if (matchedNode.argument) {
              actions.setCommandStack(newStack);
              actions.setCurrentNode(matchedNode);
              actions.setCurrentInput('');
              actions.setIsEnteringArg(true);
              setInputState('entering_argument');
            } else {
              executeCommand(newStack, actions, undefined);
            }
          }
        } else if (currentNode && !currentNode.argument) {
          // Execute handler for current node if it doesn't need args
          executeCommand(commandStack, actions, undefined);
        }
        return;
    }

    // Handle regular input
    if (!isEnteringArg && !currentNode?.argument) {
      const availableNodes = getAvailableNodes(currentNode);
      if (!isValidCommandInput(currentInput + e.key, availableNodes)) {
        e.preventDefault();
        return;
      }
    }
  }, [
    getAvailableNodes,
    getAutocompleteSuggestion,
    findMatchingCommands,
    executeCommand,
    commandTrie,
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

          currentNode = commandTrie.getCommand(currentStack);
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
