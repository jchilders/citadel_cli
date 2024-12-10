import { useCallback } from 'react';
import { CommandNode, CommandTrie } from '../types/command-trie';
import { CitadelState, CitadelActions } from '../types/state';

export interface UseCommandParserProps {
  commandTrie: CommandTrie;
}

export function useCommandParser({ commandTrie }: UseCommandParserProps) {
  const findMatchingCommands = useCallback((input: string, availableNodes: CommandNode[]): CommandNode[] => {
    if (!input) return availableNodes;
    return availableNodes.filter(node => node.getName().toLowerCase().startsWith(input.toLowerCase()));
  }, []);

  const getAutocompleteSuggestion = useCallback((input: string, availableNodes: CommandNode[]): string | null => {
    const matches = findMatchingCommands(input, availableNodes);
    if (matches.length === 1) {
      return matches[0].getName();
    }
    return null;
  }, [findMatchingCommands]);

  const getAvailableNodes = useCallback((currentNode?: CommandNode): CommandNode[] => {
    if (currentNode?.hasChildren()) {
      return Array.from(currentNode.getChildren().values());
    }
    return commandTrie.getRootCommands();
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
          if (!nextNode.hasChildren() && nextNode.getArgument()) {
            actions.setIsEnteringArg(true);
          } else {
            actions.setIsEnteringArg(false);
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
      
      if (isEnteringArg && currentNode?.getHandler() && currentInput.trim()) {
        // Execute command with argument if we have a valid command and input
        actions.executeCommand(commandStack, [currentInput]);
        // Reset state after execution
        actions.setCurrentInput('');
        actions.setIsEnteringArg(false);
      } else if (!isEnteringArg && currentInput) {
        // Try to execute a new command
        const availableNodes = getAvailableNodes(currentNode);
        const matches = findMatchingCommands(currentInput, availableNodes);
        
        if (matches.length === 1) {
          const matchedNode = matches[0];
          const newStack = [...commandStack, matchedNode.getName()];
          
          if (matchedNode.getArgument()) {
            // Command requires an argument, enter argument mode
            actions.setCommandStack(newStack);
            actions.setCurrentNode(matchedNode);
            actions.setCurrentInput('');
            actions.setIsEnteringArg(true);
          } else if (matchedNode.getHandler()) {
            // Command has a handler but no argument, execute immediately
            actions.executeCommand(newStack);
            actions.setCurrentInput('');
          }
        }
      }
    }
  }, [getAvailableNodes, findMatchingCommands, commandTrie]);

  return {
    handleInputChange,
    handleKeyDown,
    getAvailableNodes
  };
}
