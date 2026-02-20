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
    () => resolveTypography(fontFamily, fontSize ?? 'text-sm'),
    [fontFamily, fontSize]
  );

  return (
    <div
      className={`flex items-center gap-2 ${typography.className ?? ''}`.trim()}
      style={typography.style}
    >
      <span className="text-gray-200">
        &gt; {command.split(' ').map((part, i) => {
          const isArg = part.startsWith('<') && part.endsWith('>');
          return (
            <span 
              key={i} 
              className={isArg ? 'text-green-400' : 'text-gray-200'}
            >
              {i > 0 ? ' ' : ''}{part}
            </span>
          );
        })}
      </span>
      <span className="text-gray-400">·</span>
      <span className="text-gray-500">{timestamp}</span>
      {status === CommandStatus.Pending && <Spinner />}
      {status === CommandStatus.Success && (
        <div 
          data-testid="success-indicator"
          className="w-4 h-4 rounded-full bg-green-500" 
        />
      )}
      {(status === CommandStatus.Timeout || status === CommandStatus.Failure) && (
        <div 
          data-testid="success-indicator"
          className="w-4 h-4 rounded-full bg-red-500" 
        />
      )}
    </div>
  );
};
