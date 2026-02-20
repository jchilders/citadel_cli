import React, { useEffect, useCallback, useMemo } from 'react';
import { OutputItem } from '../types/state';
import { CommandOutputLine } from './CommandOutputLine';
import { useCitadelConfig } from '../config/hooks';
import { resolveTypography } from '../utils/typography';

interface CommandOutputProps {
  output: OutputItem[];
  outputRef: React.RefObject<HTMLDivElement>;
}

export const CommandOutput: React.FC<CommandOutputProps> = ({ output, outputRef }) => {
  const config = useCitadelConfig();
  const outputTypography = useMemo(
    () => resolveTypography(config.fontFamily, config.outputFontSize ?? config.fontSize),
    [config.fontFamily, config.fontSize, config.outputFontSize]
  );

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
  }, [output, scrollToBottom, outputRef]);

  return (
    <div 
      ref={outputRef}
      className="h-full overflow-y-auto border border-gray-700 rounded-lg p-3 text-left"
      data-testid="citadel-command-output"
    >
      {output.map((item) => (
        <div key={item.id} className="mb-4 last:mb-0">
          <CommandOutputLine
            command={item.command.join(' ')}
            timestamp={new Date(item.timestamp).toLocaleTimeString()}
            status={item.result.status}
            fontFamily={config.fontFamily}
            fontSize={config.fontSize}
          />
          <pre
            className={`text-gray-200 whitespace-pre ${outputTypography.className ?? ''}`.trim()}
            style={outputTypography.style}
          >
            {item.result.render()}
          </pre>
        </div>
      ))}
    </div>
  );
};
