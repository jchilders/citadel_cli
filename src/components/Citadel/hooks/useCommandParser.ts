import { useCallback } from 'react';
import { commandTrie } from '../commands-config';
import { CommandNode } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';

export function useCommandParser() {
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
    if (currentNode?.children) {
      return Array.from(currentNode.children.values());
    }
    return Array.from(commandTrie.root.values());
  }, []);

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
          if (!nextNode.children && nextNode.argument) {
            actions.setIsEnteringArg(true);
          } else {
            actions.setIsEnteringArg(false);
          }
        }
      }
    }
  }, [getAvailableNodes, getAutocompleteSuggestion]);

  const handleKeyDown = useCallback((
    e: KeyboardEvent,
    state: CitadelState,
    actions: CitadelActions
  ) => {
    const { commandStack, currentInput, isEnteringArg, currentNode } = state;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (!isEnteringArg && currentInput) {
        const availableNodes = getAvailableNodes(currentNode);
        const suggestion = getAutocompleteSuggestion(currentInput, availableNodes);
        if (suggestion) {
          actions.setCurrentInput(suggestion);
        }
      }
      return;
    }

    if (e.key === 'Backspace' && currentInput === '') {
      e.preventDefault();
      if (commandStack.length > 0) {
        const newStack = commandStack.slice(0, -1);
        const prevNode = newStack.length > 0 ? commandTrie.getCommand(newStack) : undefined;
        
        actions.setCommandStack(newStack);
        actions.setCurrentNode(prevNode);
        actions.setIsEnteringArg(false);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (isEnteringArg && currentNode?.handler) {
        // Execute command with argument
        actions.executeCommand(commandStack, [currentInput]);
      } else if (!isEnteringArg && currentInput) {
        // Try to execute command without argument
        const availableNodes = getAvailableNodes(currentNode);
        const matchingNode = availableNodes.find(
          node => node.name.toLowerCase() === currentInput.toLowerCase()
        );
        
        if (matchingNode?.handler && !matchingNode.argument) {
          const newStack = [...commandStack, matchingNode.name];
          actions.executeCommand(newStack);
        }
      }
    }
  }, [getAvailableNodes, getAutocompleteSuggestion]);

  return {
    handleInputChange,
    handleKeyDown,
    getAvailableNodes
  };
}
