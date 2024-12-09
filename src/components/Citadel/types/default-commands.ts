import { CommandNode, CommandTrie } from './command-trie';

export const createHelpCommand = (trie: CommandTrie): [string, CommandNode] => {
  const handler = async function() {
    const commands = trie.getLeafCommands()
      .filter((cmd: CommandNode) => cmd.fullPath[0] !== 'help')
      .map((cmd: CommandNode) => {
        const cmdStr = cmd.fullPath.join(' ') + (cmd.argument ? ` <${cmd.argument.name}>` : '');
        return `${cmdStr} - ${cmd.description}`;
      })
      .sort();

    // Add help command at the end if it's enabled
    if (trie.includeHelpCommand) {
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
