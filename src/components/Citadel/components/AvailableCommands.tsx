import React from 'react';
import { useCitadelCommands, useCitadelConfig, useSegmentStack } from '../config/CitadelConfigContext';
import { Logger } from '../utils/logger';
import { useSegmentStackVersion } from '../hooks/useSegmentStackVersion';

export const AvailableCommands: React.FC = () => {
  const commands  = useCitadelCommands();
  const config = useCitadelConfig();
  const segmentStack = useSegmentStack();
  const segmentStackVersion = useSegmentStackVersion();

  const containerClasses = "h-12 mt-2 border-t border-gray-700 px-4";
  const contentClasses = "text-gray-300 pt-2";

  const nextCommandSegments = commands.getCompletions(segmentStack.path());
  Logger.debug("[AvailableCommands] nextCommandSegments: ", nextCommandSegments);
  
  const sortedCommands = React.useMemo(() => {
    if (config.includeHelpCommand) {
      const nonHelpCommands = nextCommandSegments.filter(segment => segment.name !== 'help');
      const helpCommand = nextCommandSegments.find(segment => segment.name === 'help');
      return [...nonHelpCommands, ...(helpCommand ? [helpCommand] : [])];
    }

    return nextCommandSegments;
  }, [nextCommandSegments, segmentStackVersion, config.includeHelpCommand]);

  const nextSegmentIsArgument = nextCommandSegments.some(seg => seg.type === 'argument');
  const nextSegment = nextCommandSegments[0];
  return (
    <div className={containerClasses} data-testid="available-commands">
      <div className={contentClasses}>
        {!nextSegmentIsArgument ? (
          <div className="flex flex-wrap gap-2">
            {sortedCommands?.map((segment) => {
              const boldLength = sortedCommands?.reduce((length, other) => {
                if (other === segment) return length;
                let commonPrefix = 0;
                while (
                  commonPrefix < segment.name.length &&
                  commonPrefix < other.name.length &&
                  segment.name[commonPrefix].toLowerCase() === other.name[commonPrefix].toLowerCase()
                ) {
                  commonPrefix++;
                }
                return Math.max(length, commonPrefix + 1);
              }, 1);

              return (
                <div
                  key={segment.name}
                  className="px-2 py-1 rounded bg-gray-800 mr-2 last:mr-0"
                >
                  <span className="font-mono text-white">
                    <strong className="underline">{segment.name.slice(0, boldLength)}</strong>
                    {segment.name.slice(boldLength)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : nextCommandSegments.length > 0 ? (
          <>
            <span className="text-blue-400">{nextSegment.name}</span>
            {nextSegment.description && (
              <span className="text-gray-400 ml-2">- {nextSegment.description}</span>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
