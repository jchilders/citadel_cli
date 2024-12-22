import React, { useEffect, useCallback } from 'react';
import { OutputItem } from '../types/state';
import { CommandOutputLine } from './CommandOutputLine';
import { useCitadelConfig } from '../config/CitadelConfigContext';
import { CommandResultType } from '../types/command-results';

interface CommandOutputProps {
  output: OutputItem[];
  outputRef: React.RefObject<HTMLDivElement>;
}

const renderValue = (type: CommandResultType, value: any) => {
  switch (type) {
    case 'text':
      return <pre className="whitespace-pre-wrap">{value}</pre>;
    
    case 'json':
      return <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>;
    
    case 'image':
      return (
        <img 
          src={value.src} 
          alt={value.alt || ''} 
          className="max-w-full h-auto rounded-lg shadow-lg"
        />
      );
    
    case 'html':
      return <div dangerouslySetInnerHTML={{ __html: value }} />;
    
    case 'markdown':
      // For now, just render as preformatted text
      // TODO: Add react-markdown when available
      return <pre className="whitespace-pre-wrap">{value}</pre>;
    
    case 'table':
      return (
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              {value.headers.map((header: string, i: number) => (
                <th 
                  key={i}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {value.rows.map((row: any[], i: number) => (
              <tr key={i}>
                {row.map((cell: any, j: number) => (
                  <td 
                    key={j}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-200"
                  >
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    
    case 'error':
      return (
        <div className="text-red-500">
          Error: {value.message}
        </div>
      );
    
    case 'pending':
      return null;
    
    default:
      return <pre className="whitespace-pre-wrap">{JSON.stringify(value)}</pre>;
  }
};

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
      className="h-full overflow-y-auto border border-gray-700 rounded-lg p-3"
    >
      {output.map((item, index) => (
        <div key={index} className="mb-4 last:mb-0">
          <CommandOutputLine
            command={item.command.join(' ')}
            timestamp={new Date(item.timestamp).toLocaleTimeString()}
            status={item.result.getStatus()}
          />
          <div className={`mt-2 font-mono ${config.outputFontSize}`}>
            {renderValue(item.result.type as CommandResultType, item.result.value)}
          </div>
        </div>
      ))}
    </div>
  );
};