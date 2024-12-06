import React from 'react';
import { CommandNode } from '../types/command-trie';
import { CitadelState } from '../types/state';

interface AvailableCommandsProps {
  state: CitadelState;
  availableCommands: CommandNode[];
}

export const AvailableCommands: React.FC<AvailableCommandsProps> = ({
  state,
  availableCommands
}) => {
  const showCommands = !state.isEnteringArg && availableCommands.length > 0;
  const containerClasses = "h-12 mt-2 border-t border-gray-700 px-4";
  const contentClasses = "text-gray-300 pt-2";

  // Show description for leaf nodes without children or arguments
  const isLeafNode = state.currentNode && !state.currentNode.children && !state.currentNode.argument;

  return (
    <div className={containerClasses}>
      {isLeafNode ? (
        <div className={contentClasses}>
          <span className="text-blue-400">{state.currentNode.name}</span>
          <span className="text-gray-400 ml-2">- {state.currentNode.description}</span>
        </div>
      ) : showCommands ? (
        <div className={contentClasses}>
          <div className="flex flex-wrap gap-2">
            {availableCommands.map((cmd) => {
              const boldLength = availableCommands.reduce((length, other) => {
                if (other.name === cmd.name) return length;
                let commonPrefix = 0;
                while (
                  commonPrefix < cmd.name.length &&
                  commonPrefix < other.name.length &&
                  cmd.name[commonPrefix].toLowerCase() === other.name[commonPrefix].toLowerCase()
                ) {
                  commonPrefix++;
                }
                return Math.max(length, commonPrefix + 1);
              }, 1);

              return (
                <div
                  key={cmd.name}
                  className="px-2 py-1 rounded bg-gray-800 mr-2 last:mr-0"
                >
                  <span className="font-mono text-white">
                    <strong className="underline">{cmd.name.slice(0, boldLength)}</strong>
                    {cmd.name.slice(boldLength)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={contentClasses}>
          {state.isEnteringArg && state.currentNode?.argument ? (
            <div className="text-gray-400">
              {state.currentNode.argument.description}
            </div>
          ) : (
            <div className="text-gray-500">No available commands</div>
          )}
        </div>
      )}
    </div>
  );
};