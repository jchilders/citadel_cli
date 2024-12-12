import { useCallback, useState } from 'react';
import { CommandNode, CommandTrie } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';

type InputState = 'idle' | 'entering_command' | 'entering_argument';

export interface UseCommandParserProps {
  commandTrie: CommandTrie;
}

export function useCommandParser({ commandTrie }: UseCommandParserProps) {
  const [inputState, setInputState] = useState<InputState>('idle');

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
      const availableNodes = getAvailableNodes(state.currentNode);
      const suggestion = getAutocompleteSuggestion(newValue, availableNodes);
      
      if (suggestion && suggestion !== newValue) {
        const newStack = [...state.commandStack, suggestion];
        const nextNode = commandTrie.getCommand(newStack);
        
        if (nextNode) {
          actions.setCommandStack(newStack);
          actions.setCurrentInput('');
          actions.setCurrentNode(nextNode);
          
          // If this is a leaf node with an argument, enter argument mode
          if (!nextNode.hasChildren && nextNode.argument) {
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
