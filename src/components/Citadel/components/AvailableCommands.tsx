import React from 'react';
import { useCitadelCommands, useCitadelConfig, useSegmentStack } from '../config/hooks';
import { Logger } from '../utils/logger';
import { resolveTypography } from '../utils/typography';
import { getCommandPrefixLengths } from '../types/command-prefix';

interface AvailableCommandsProps {
  currentInput?: string;
}

export const AvailableCommands: React.FC<AvailableCommandsProps> = ({ currentInput = '' }) => {
  const commands  = useCitadelCommands();
  const config = useCitadelConfig();
  const segmentStack = useSegmentStack();
  const commandTypography = React.useMemo(
    () => resolveTypography(config.fontFamily, config.fontSize),
    [config.fontFamily, config.fontSize]
  );

  const normalizedInput = currentInput.trim().toLowerCase();
  const filteredCommandSegments = commands.getMatchingCompletions(
    segmentStack.path(),
    normalizedInput
  );

  Logger.debug("[AvailableCommands] nextCommandSegments: ", filteredCommandSegments);
  
  const sortedCommands = React.useMemo(() => {
    const segments = [...filteredCommandSegments];
    const isHelpSegment = (segment: typeof segments[number]) =>
      segment.name.toLowerCase() === 'help';

    const helpSegments = segments.filter(isHelpSegment);
    const nonHelpSegments = segments.filter(segment => !isHelpSegment(segment));
    const sortedNonHelpSegments = nonHelpSegments.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );

    return [...sortedNonHelpSegments, ...helpSegments];
  }, [filteredCommandSegments]);

  const boldLengths = React.useMemo(
    () => getCommandPrefixLengths(sortedCommands),
    [sortedCommands]
  );

  const nextSegmentIsArgument = filteredCommandSegments.some(seg => seg.type === 'argument');
  const nextSegment = filteredCommandSegments[0];
  return (
    <div className="citadel-available-commands" data-testid="available-commands">
      <div className="citadel-available-commands-content" style={commandTypography.style}>
        {!nextSegmentIsArgument ? (
          <div className="citadel-available-chip-list">
            {sortedCommands?.map((segment) => {
              const boldLength = boldLengths.get(segment.name) ?? 1;

              return (
                <div
                  key={segment.name}
                  data-testid="available-command-chip"
                  className="citadel-available-chip"
                >
                  <span className="citadel-available-chip-text">
                    <strong className="citadel-available-chip-prefix">{segment.name.slice(0, boldLength)}</strong>
                    {segment.name.slice(boldLength)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : filteredCommandSegments.length > 0 ? (
          <>
            <span className="citadel-available-next-arg">{nextSegment.name}</span>
            {nextSegment.description && (
              <span className="citadel-available-next-desc">- {nextSegment.description}</span>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
