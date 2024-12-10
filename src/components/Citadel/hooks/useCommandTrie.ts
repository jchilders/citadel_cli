import { useMemo } from 'react';
import { CommandTrie } from '../types/command-trie';
import { useCitadelConfig } from '../config/CitadelConfigContext';
import { initializeCommands } from '../commands-config';
import { createHelpCommand } from '../types/default-commands';

export const useCommandTrie = () => {
  const config = useCitadelConfig();
  
  const commandTrie = useMemo(() => {
    const trie = new CommandTrie();
    if (config.includeHelpCommand) {
      const [helpCommandName, helpCommandNode] = createHelpCommand(trie);
      trie.addCommand({
        path: [helpCommandName],
        description: helpCommandNode.description,
        handler: helpCommandNode.handler,
        argument: helpCommandNode.argument,
      });
    }
    initializeCommands(trie);
    return trie;
  }, [config.includeHelpCommand]);

  return commandTrie;
};
