import { useMemo } from 'react';
import { CommandTrie } from '../types/command-trie';
import { useCitadelConfig, useCitadelCommands } from '../config/CitadelConfigContext';
import { createHelpCommand } from '../types/help-command';

export const useCommandTrie = () => {
  const config = useCitadelConfig();
  const commands = useCitadelCommands();
  
  const commandTrie = useMemo(() => {
    const trie = new CommandTrie();
    
    if (config.includeHelpCommand) {
      const [helpCommandName, helpCommandNode] = createHelpCommand(trie, config);
      trie.addCommand({
        segments: [helpCommandName],
        description: helpCommandNode.description,
        handler: helpCommandNode.handler,
        argument: helpCommandNode.argument,
      });
    }

    // Add provided commands if any
    if (commands) {
      Object.entries(commands).forEach(([path, command]) => {
        const segments = path.split('.').map(segment => ({
          type: 'word' as const,
          value: segment
        }));
        
        trie.addCommand({
          segments: segments,
          description: command.description,
          handler: command.handler,
          arguments: command.arguments ? command.arguments.map(arg => ({
            type: 'argument' as const,
            ...arg
          })) : undefined
        });
      });
    }

    return trie;
  }, [config.includeHelpCommand, commands]);

  return commandTrie;
};
