import { CommandNode, CommandTrie } from './command-trie';
import { CitadelConfig } from '../config/types';

export const createHelpCommand = (trie: CommandTrie, config: CitadelConfig): [string, CommandNode] => {
  const handler = async function() {
    const commands = trie.getLeafCommands()
      .filter((cmd: CommandNode) => cmd.getName() !== 'help')
      .map((cmd: CommandNode) => {
        const cmdStr = cmd.getFullPath().join(' ') + (cmd.hasArgument() ? ` <${cmd.getArgument()?.name}>` : '');
        return `${cmdStr} - ${cmd.getDescription()}`;
      })
      .sort();

    // Add help command at the end if it's enabled
    if (config.includeHelpCommand) {
      commands.push('help - Show available commands');
    }

    return {
      text: commands.length > 0
        ? 'Available Commands:\n' + commands.join('\n')
        : 'No commands available yet. Add some commands to get started!'
    };
  };

  return ['help', new CommandNode({
    fullPath: ['help'],
    description: 'Show available commands',
    handler
  })];
};
