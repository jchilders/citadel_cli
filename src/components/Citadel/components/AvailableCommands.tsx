import React from 'react';
import { CitadelState } from '../types/state';
import { useCitadelCommands, useCitadelConfig } from '../config/CitadelConfigContext';
import { useSegmentStack } from '../hooks/useSegmentStack';

interface AvailableCommandsProps {
  state: CitadelState;
  availableCommands: string[];
}

export const AvailableCommands: React.FC<AvailableCommandsProps> = ({
  state,
  availableCommands
}) => {
  const config = useCitadelConfig();
  const commands = useCitadelCommands();
  const segmentStack = useSegmentStack();

  const containerClasses = "h-12 mt-2 border-t border-gray-700 px-4";
  const contentClasses = "text-gray-300 pt-2";

  const showCommands = !state.isEnteringArg && availableCommands.length > 0;

  // Show description for leaf nodes without handlers or arguments
  // instead we need to get the completions for the current segmentStack.path and see if there are any more segments
  const path = segmentStack.path();
  const completions = commands.getCompletions(path);
  const isLeafNode = completions.length === 0;

  const sortedCommands = React.useMemo(() => {
    if (!state.commandStack.length && config.includeHelpCommand) {
      const nonHelpCommands = availableCommands.filter(cmd => cmd !== 'help');
      const helpCommand = availableCommands.find(cmd => cmd === 'help');
      return [...nonHelpCommands, ...(helpCommand ? [helpCommand] : [])];
    }
    return availableCommands;
  }, [availableCommands, state.commandStack, config.includeHelpCommand]);

  return (
    <div className={containerClasses} data-testid="available-commands">
      {isLeafNode ? (
        <div className={contentClasses}>
          {!segmentStack.isEmpty() ? (
            <>
              <span className="text-blue-400">{segmentStack.peek().name}</span>
              <span className="text-gray-400 ml-2">- {segmentStack.peek().description}</span>
            </>
          ) : null}
        </div>
      ) : showCommands ? (
        <div className={contentClasses}>
          <div className="flex flex-wrap gap-2">
            {sortedCommands.map((cmd) => {
              const boldLength = sortedCommands.reduce((length, other) => {
                if (other === cmd) return length;
                let commonPrefix = 0;
                while (
                  commonPrefix < cmd.length &&
                  commonPrefix < other.length &&
                  cmd[commonPrefix].toLowerCase() === other[commonPrefix].toLowerCase()
                ) {
                  commonPrefix++;
                }
                return Math.max(length, commonPrefix + 1);
              }, 1);

              return (
                <div
                  key={cmd}
                  className="px-2 py-1 rounded bg-gray-800 mr-2 last:mr-0"
                >
                  <span className="font-mono text-white">
                    <strong className="underline">{cmd.slice(0, boldLength)}</strong>
                    {cmd.slice(boldLength)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={contentClasses}>{segmentStack.peek().description}</div>
      )}
    </div>
  );
};
