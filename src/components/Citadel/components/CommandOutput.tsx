import React, { useEffect } from 'react';
import { OutputItem } from '../types/state';
import { CommandOutputLine } from './CommandOutputLine';

interface CommandOutputProps {
  output: OutputItem[];
  outputRef: React.RefObject<HTMLDivElement>;
}

const formatCommandOutput = (result: OutputItem['result']) => {
  if (result.json) {
    return (
      <pre className="text-gray-200">
        {JSON.stringify(result.json, null, 2)}
      </pre>
    );
  }
  
  return null;
};

export const CommandOutput: React.FC<CommandOutputProps> = ({ output, outputRef }) => {
  // Scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      const scrollContainer = outputRef.current;
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    }
  }, [output]);

  return (
    <div 
      ref={outputRef}
      className="h-full overflow-y-auto border border-gray-700 rounded-lg p-3"
    >
      {output.map((item, index) => (
        <div key={index} className="mb-4 last:mb-0">
          <CommandOutputLine
            command={item.command.join(' ')}
            timestamp={new Date(item.timestamp).toLocaleTimeString()}
            status={item.status}
          />
          {item.error ? (
            <div className="mt-1 text-red-400">{item.error}</div>
          ) : (
            formatCommandOutput(item.result)
          )}
        </div>
      ))}
    </div>
  );
};