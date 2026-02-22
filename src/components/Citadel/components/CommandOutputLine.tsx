import React, { useMemo } from 'react';
import { Spinner } from './Spinner';
import { CommandStatus } from '../types/command-results';
import { resolveTypography } from '../utils/typography';

interface CommandOutputLineProps {
  command: string;
  timestamp: string;
  status: CommandStatus;
  fontFamily?: string;
  fontSize?: string;
}

export const CommandOutputLine: React.FC<CommandOutputLineProps> = ({
  command,
  timestamp,
  status,
  fontFamily,
  fontSize
}) => {
  const typography = useMemo(
    () => resolveTypography(fontFamily, fontSize ?? '0.875rem'),
    [fontFamily, fontSize]
  );

  return (
    <div
      className="citadel-output-line"
      style={typography.style}
    >
      <span className="citadel-output-command">
        &gt; {command.split(' ').map((part, i) => {
          const isArg = part.startsWith('<') && part.endsWith('>');
          return (
            <span 
              key={i} 
              className={isArg ? 'citadel-output-command-arg' : 'citadel-output-command-word'}
            >
              {i > 0 ? ' ' : ''}{part}
            </span>
          );
        })}
      </span>
      <span className="citadel-output-separator">·</span>
      <span className="citadel-output-timestamp">{timestamp}</span>
      {status === CommandStatus.Pending && <Spinner />}
      {status === CommandStatus.Success && (
        <div 
          data-testid="success-indicator"
          className="citadel-status-dot citadel-status-dot-success" 
        />
      )}
      {(status === CommandStatus.Timeout || status === CommandStatus.Failure) && (
        <div 
          data-testid="success-indicator"
          className="citadel-status-dot citadel-status-dot-failure" 
        />
      )}
    </div>
  );
};
