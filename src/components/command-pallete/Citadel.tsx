import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { defaultCommandConfig } from './commands-config';
import { Command, CommandArg, CommandConfig, CommandItem, OutputItem } from './types';

import { Cursor } from './Cursor';
import { defaultCursorConfig } from './cursor-config';

export const Citadel: React.FC<{ commands?: CommandConfig }> = ({ commands = defaultCommandConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [commandStack, setCommandStack] = useState<string[]>([]);
  const [currentArg, setCurrentArg] = useState<CommandArg | null>(null);
  const [input, setInput] = useState('');
  const [available, setAvailable] = useState<CommandItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [output, setOutput] = useState<OutputItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get available commands at current level
  const getAvailableCommands = (stack: string[]) => {
    let current: CommandConfig = commands;
    for (const cmd of stack) {
      const nextCommands = current[cmd]?.subcommands;
      if (!nextCommands) break;
      current = nextCommands;
    }
    return current ? Object.entries(current).map(([name, details]) => ({
      name,
      ...details
    }))
    .sort((a, b) => a.name.localeCompare(b.name)) : [];
  };

  // Initialize or reset state
  const initialize = () => {
    const commands = getAvailableCommands([]);
    setAvailable(commands);
    setSelectedIndex(0);
    setInput('');
  };

  // Execute command
  const executeCommand = async (args?: string[]) => {
    let current = commands;
    for (const cmd of commandStack) {
      if (!current[cmd]) return;
      if (current[cmd].handler) {
        setIsLoading(true);
        try {
          const result = await current[cmd].handler(args || []);
          setOutput([...output, {
            command: [...commandStack, ...(args || [])].join(' '),
            response: result
          }]);
        } finally {
          setIsLoading(false);
          // Clean up after command execution
          setCommandStack([]);
          setInput('');
          setCurrentArg(null);
          initialize();
        }
        return;
      }
      if (!current[cmd].subcommands) return;
      current = current[cmd].subcommands;
    }
  };

  // Update input based on available commands
  const updateFilteredCommands = (value: string) => {
    const filtered = available.filter(cmd =>
      cmd.name.toLowerCase().startsWith(value.toLowerCase())
    );
    if (filtered.length === 1) {
      // Automatically select and advance if there's an exact match
      const selectedCommand = filtered[0];
      const newStack = [...commandStack, selectedCommand.name];
      setCommandStack(newStack);
      setInput('');

      // Get the full command and handle next step
      const command = getCommandFromStack(newStack, commands);
      if (command?.args?.length) {
        setCurrentArg(command.args[0]);
        setAvailable([]); // Clear available commands while entering args
      } else if (command?.subcommands) {
        const nextCommands = getAvailableCommands(newStack);
        setAvailable(nextCommands);
        setSelectedIndex(0);
      }
    } else if (filtered.length > 0) {
      setAvailable(filtered);
      setSelectedIndex(0);
    }
  };

  // Get window height based on content
  const getCitadelHeight = () => {
    const baseHeight = 64; // Base padding and margins
    const commandHeight = 40; // Height per command
    const outputHeight = output.length * 48; // Height per output line
    const totalHeight = baseHeight + (available.length * commandHeight) + outputHeight;
    return Math.min(totalHeight, 480); // Cap at 480px
  };

  // Set window height based on content
  const setCitadelHeight = (height: number) => {
    const citadelElement = document.querySelector('.citadel-window') as HTMLElement;
    if (citadelElement) {
      citadelElement.style.height = `${height}px`;
    }
  };

  // Reset window state while maintaining height
  const clearWindow = () => {
    const prevHeight = getCitadelHeight();
    setOutput([]);
    setCommandStack([]);
    setInput('');
    setCurrentArg(null);
    setAvailable([]);
    setSelectedIndex(0);
    setCitadelHeight(prevHeight);
  };

  // Show the list of available commands when the component first opens
  useEffect(() => {
    if (isOpen) {
      initialize();
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === '.') {
          e.preventDefault();
          setIsOpen(true);
          setIsClosing(false);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setIsClosing(true);
          setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
            setCommandStack([]);
            setInput('');
            setCurrentArg(null);
          }, 150);
          break;

        case 'Tab':
        case 'ArrowDown':
        case 'ArrowUp':
          e.preventDefault();
          if (available.length > 0) {
            const delta = (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) ? -1 : 1;
            const nextIndex = (selectedIndex + delta + available.length) % available.length;
            setSelectedIndex(nextIndex);
            setInput(available[nextIndex].name);
          }
          break;

        case 'Backspace':
          if (input === '') {
            const newStack = commandStack.slice(0, -1);
            setCommandStack(newStack);
            const commands = getAvailableCommands(newStack);
            setAvailable(commands);
            setSelectedIndex(0);
            setInput('');
            setCurrentArg(null);
          } else {
            const newInput = input.slice(0, -1);
            setInput(newInput);
            if (!currentArg) {
              updateFilteredCommands(newInput);
            }
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (currentArg) {
            if (input.trim()) {
              await executeCommand([input]);
            }
          } else if (available.length === 1) {
            // If there's only one command available, select it
            const selectedCommand = available[0];
            const newStack = [...commandStack, selectedCommand.name];
            setCommandStack(newStack);
            const command = getCommandFromStack(newStack, commands);

            if (command?.args?.length) {
              setCurrentArg(command.args[0]);
              setInput('');
              setAvailable([]);
            } else if (command?.handler) {
              await executeCommand();
            }
          } else if (commandStack.length > 0) {
            // Check if we have a complete command that can be executed
            const command = getCommandFromStack(commandStack, commands);
            if (command?.handler && !command.args?.length) {
              await executeCommand();
            }
          }
          break;
  
          default:
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
              const newInput = input + e.key;
              setInput(newInput);
              if (!currentArg) {
                updateFilteredCommands(newInput);
              }
            }
            break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing, commandStack, input, available, selectedIndex, currentArg]);

  // Scroll the output pane whenever output changes so the user can see the
  // result
  useEffect(() => {
    const outputDiv = document.querySelector('.max-h-48.overflow-y-auto');
    if (outputDiv) {
      outputDiv.scrollTop = outputDiv.scrollHeight;
    }
  }, [output]);

  const getCommandFromStack = (
    stack: string[], 
    commandConfig: CommandConfig
  ): Command | undefined => {
    let current: Command | undefined;
    let config = commandConfig;
  
    for (const cmd of stack) {
      current = config[cmd];
      if (current?.subcommands) {
        config = current.subcommands;
      }
    }
  
    return current;
  };// Format response for display
  const formatResponse = (response: unknown) => {
    if (typeof response === 'object' && response !== null) {
      return (
        <div className="pl-4 space-y-1">
          {Object.entries(response).map(([key, value]) => (
            <div key={key}>
              <strong className="text-gray-300">{key}:</strong>{' '}
              <span className="text-gray-400">
                {Array.isArray(value) ? value.join(', ') : value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return <div className="pl-4 text-gray-400">{String(response)}</div>;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gray-900 text-white ${
      isClosing ? 'animate-slide-down' : 'animate-slide-up'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div className="max-h-48 overflow-y-auto p-4">
          {output.map((item, index) => (
            <div key={index} className="mb-4 font-mono">
              <div className="text-gray-400">{item.command}</div>
              {formatResponse(item.response)}
            </div>
          ))}
        </div>

        {/* Command Input Section */}
        <div className="border-t border-gray-700 p-4">
          {/* Command Line */}
          <div className="flex items-center mb-2">
            <div className="text-gray-400 mr-2">
              {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : '⟩'}
            </div>
            <div className="font-mono">
              {commandStack.join(' ')}
              {commandStack.length > 0 && ' '}
              {input}
              <Cursor style={defaultCursorConfig} />
            </div>
          </div>

          {/* Current Argument Help */}
          {currentArg && (
            <div className="text-sm text-gray-400 ml-6 mb-2">
              {currentArg.description}
            </div>
          )}

          {/* Available Commands */}
          {!currentArg && available.length > 0 && (
            <div className="mt-2 border-t border-gray-700 pt-2">
              <div className="flex flex-wrap gap-2">
                {available.map((cmd, index) => (
                  <div
                    key={cmd.name}
                    className={`px-2 py-1 rounded ${
                      index === selectedIndex ? 'bg-blue-600' : 'bg-gray-800'
                    }`}
                  >
                    <span className="font-mono text-white">{cmd.name}</span>
                  </div>
                ))}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Citadel;
