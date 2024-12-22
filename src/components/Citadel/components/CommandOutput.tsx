import React, { useEffect, useCallback, useRef } from 'react';
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
          loading="lazy"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (!img) return;
            
            // Force a reflow to ensure the image height is calculated
            const currentHeight = img.offsetHeight;
            if (currentHeight) {
              img.style.height = currentHeight + 'px';
              // Remove the fixed height after a frame to allow responsive sizing
              requestAnimationFrame(() => {
                if (img.style) {
                  img.style.height = '';
                }
              });
            }
          }}
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
              <tr key={i} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {cell}
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
      return <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>;
  }
};

export const CommandOutput: React.FC<CommandOutputProps> = ({ output, outputRef }) => {
  const config = useCitadelConfig();
  const lastScrollRef = useRef<number>(0);
  const isUserScrollingRef = useRef<boolean>(false);
  const pendingScrollRef = useRef<boolean>(false);

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      const scrollContainer = outputRef.current;
      const isAtBottom = Math.abs(
        (scrollContainer.scrollHeight - scrollContainer.scrollTop) - 
        scrollContainer.clientHeight
      ) < 50;

      // Only auto-scroll if user is already near the bottom or hasn't scrolled manually
      if (isAtBottom || !isUserScrollingRef.current) {
        // Set a flag to indicate we want to scroll
        pendingScrollRef.current = true;
        
        // Try to scroll immediately
        requestAnimationFrame(() => {
          if (pendingScrollRef.current && outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
            lastScrollRef.current = outputRef.current.scrollHeight;
            
            // Try again after a short delay to handle late DOM updates
            setTimeout(() => {
              if (pendingScrollRef.current && outputRef.current) {
                outputRef.current.scrollTop = outputRef.current.scrollHeight;
                pendingScrollRef.current = false;
              }
            }, 100);
          }
        });
      }
    }
  }, [outputRef]);

  // Handle manual scrolling
  useEffect(() => {
    if (!outputRef.current) return;

    const scrollContainer = outputRef.current;
    const handleScroll = () => {
      const isAtBottom = Math.abs(
        (scrollContainer.scrollHeight - scrollContainer.scrollTop) - 
        scrollContainer.clientHeight
      ) < 50;

      // If user scrolls up, mark as manual scrolling
      if (!isAtBottom && scrollContainer.scrollTop < lastScrollRef.current) {
        isUserScrollingRef.current = true;
      }

      // If user scrolls to bottom, reset manual scroll flag
      if (isAtBottom) {
        isUserScrollingRef.current = false;
      }

      lastScrollRef.current = scrollContainer.scrollTop;
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Set up a mutation observer to detect any DOM changes
  useEffect(() => {
    if (!outputRef.current) return;

    const observer = new MutationObserver((mutations) => {
      const hasLayoutChanges = mutations.some(mutation => 
        mutation.type === 'childList' || 
        mutation.type === 'characterData' ||
        [...(mutation.addedNodes || [])].some(node => 
          node instanceof HTMLElement && 
          (node.tagName === 'IMG' || node.tagName === 'PRE')
        )
      );

      if (hasLayoutChanges) {
        scrollToBottom();
      }
    });

    observer.observe(outputRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'src']
    });

    return () => observer.disconnect();
  }, [scrollToBottom]);

  // Scroll to bottom when output array changes
  useEffect(() => {
    scrollToBottom();
  }, [output, scrollToBottom]);

  // Handle all images, including cached ones
  useEffect(() => {
    if (!outputRef.current) return;

    const handleImageLoad = () => {
      scrollToBottom();
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLElement) {
              // Handle both new images and existing images
              const images = [
                ...(node.tagName === 'IMG' ? [node] : []),
                ...Array.from(node.getElementsByTagName('img'))
              ];
              
              images.forEach(img => {
                if (img instanceof HTMLImageElement) {
                  if (img.complete) {
                    // Image is already loaded (possibly from cache)
                    handleImageLoad();
                  } else {
                    // Image is still loading
                    img.addEventListener('load', handleImageLoad);
                  }
                }
              });
            }
          });
        }
      });
    });

    observer.observe(outputRef.current, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [scrollToBottom]);

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