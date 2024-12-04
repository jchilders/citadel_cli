import React from 'react';
import { Command } from '../types/command-types';

interface CommandSuggestionsProps {
  commands: Command[];
}

const findUniquePrefixLength = (command: string, allCommands: string[]): number => {
  let prefixLength = 1;
  while (prefixLength <= command.length) {
    const prefix = command.slice(0, prefixLength);
    const matchingCommands = allCommands.filter(cmd => 
      cmd !== command && cmd.startsWith(prefix)
    );
    if (matchingCommands.length === 0) {
      break;
    }
    prefixLength++;
  }
  return prefixLength;
};

export const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({ commands }) => {
  const commandNames = commands.map(cmd => cmd.name);
  
  return (
    <div className="mt-2 space-y-1">
      {commands.map((command) => {
        const prefixLength = findUniquePrefixLength(command.name, commandNames);
        const prefix = command.name.slice(0, prefixLength);
        const rest = command.name.slice(prefixLength);
        
        return (
          <div key={command.name} className="text-sm">
            <span className="font-bold underline">{prefix}</span>
            <span>{rest}</span>
            <span className="text-gray-500 ml-2">{command.description}</span>
          </div>
        );
      })}
    </div>
  );
};
