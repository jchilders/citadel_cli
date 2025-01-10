import React, { useEffect, useCallback } from 'react';
import { OutputItem } from '../types/state';
import { CommandOutputLine } from './CommandOutputLine';
import { useCitadelConfig } from '../config/CitadelConfigContext';

interface CommandOutputProps {
  output: OutputItem[];
  outputRef: React.RefObject<HTMLDivElement>;
}

export const CommandOutput: React.FC<CommandOutputProps> = ({ output, outputRef }) => {
  const config = useCitadelConfig();
  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      const scrollContainer = outputRef.current;
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    }
  }, [outputRef]);

  // Scroll to bottom when output changes
  useEffect(() => {
    scrollToBottom();

    // Also set up listeners for any images that might load
    if (outputRef.current) {
      const images = outputRef.current.getElementsByTagName('img');
      const lastImage = images[images.length - 1];
      if (lastImage && !lastImage.complete) {
        lastImage.addEventListener('load', scrollToBottom);
        return () => lastImage.removeEventListener('load', scrollToBottom);
      }
    }
  }, [output, scrollToBottom]);

  return (
    <div 
      ref={outputRef}
      className="h-full overflow-y-auto border border-gray-700 rounded-lg p-3 text-left"
    >
      {output.map((item, index) => (
        <div key={index} className="mb-4 last:mb-0">
          <CommandOutputLine
            command={item.command.join(' ')}
            timestamp={new Date(item.timestamp).toLocaleTimeString()}
            status={item.result.status}
          />
          <pre className={`text-gray-200 whitespace-pre font-mono ${config.outputFontSize}`}>
            {item.result.render()}
          </pre>
        </div>
      ))}
    </div>
  );
};
