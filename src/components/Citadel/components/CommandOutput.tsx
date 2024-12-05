import React, { useEffect } from 'react';
import { OutputItem } from '../types/state';

interface CommandOutputProps {
  output: OutputItem[];
  outputRef: React.RefObject<HTMLDivElement>;
}

const formatCommandOutput = (result: OutputItem['result']) => {
  if (result.text) {
    return <pre className="text-gray-200">{result.text}</pre>;
  }
  
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
      {output.length === 0 ? (
        <div className="text-gray-500">No output available</div>
      ) : (
        output.map((item, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>&gt; {item.command.join(' ')}</span>
              <span>·</span>
              <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
            {item.error ? (
              <div className="mt-1 text-red-400">{item.error}</div>
            ) : (
              formatCommandOutput(item.result)
            )}
          </div>
        ))
      )}
    </div>
  );
};