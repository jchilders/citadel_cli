import { useMemo } from 'react';
import { CommandTrie } from '../types/command-trie';
import { useCitadelConfig, useCitadelCommands } from '../config/CitadelConfigContext';
import { createHelpCommand } from '../types/default-commands';

export const useCommandTrie = () => {
  const config = useCitadelConfig();
  const commands = useCitadelCommands();
  
  const commandTrie = useMemo(() => {
    const trie = new CommandTrie();
    
    // Only add help command if configured
    if (config.includeHelpCommand) {
      const [helpCommandName, helpCommandNode] = createHelpCommand(trie, config);
      trie.addCommand({
        path: [helpCommandName],
        description: helpCommandNode.description,
        handler: helpCommandNode.handler,
        argument: helpCommandNode.argument,
      });
    }

    // Add provided commands if any
    if (commands) {
      Object.entries(commands).forEach(([path, command]) => {
        trie.addCommand({
          path: path.split('.'),
          ...command
        });
      });
    }

    return trie;
  }, [config.includeHelpCommand, commands]);

  return commandTrie;
};
