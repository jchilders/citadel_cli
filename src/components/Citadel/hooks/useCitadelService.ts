import { useState, useEffect, useCallback } from 'react';
import { CitadelService } from '../services/CitadelService';
import { CitadelState, CitadelActions } from '../types/state';
import { CommandDoc } from '../types/command-docs';
import { CommandNode } from '../types/command-trie';

export function useCitadelService(service: CitadelService) {
  const [state, setState] = useState<CitadelState>(() => service.getState());
  const [actions] = useState<CitadelActions>(() => service.createActions());
  const [availableCommands, setAvailableCommands] = useState<CommandNode[]>(() => 
    service.getAvailableCommands(state.commandStack)
  );

  useEffect(() => {
    const unsubscribe = service.onStateChange(newState => {
      setState(newState);
      setAvailableCommands(service.getAvailableCommands(newState.commandStack));
    });

    return unsubscribe;
  }, [service]);

  const searchDocs = useCallback((query: string): CommandDoc[] => {
    return service.searchDocs(query);
  }, [service]);

  const getDocs = useCallback((commandId: string): CommandDoc | undefined => {
    return service.getDocs(commandId);
  }, [service]);

  return {
    state,
    actions,
    availableCommands,
    commandTrie: service.getCommandTrie(),
    searchDocs,
    getDocs,
  };
}
