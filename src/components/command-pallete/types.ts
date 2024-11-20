export interface Command {
  description: string;
  handler?: CommandHandler;
  args?: CommandArg[];
  subcommands?: Record<string, Command>;
}

export interface CommandArg {
  name: string;
  description: string;
}

export interface CommandHandler {
  (args: string[]): Promise<Record<string, unknown>>;
}

export type CommandConfig = Record<string, Command>;

export interface CommandItem {
  name: string;
  description?: string;
  handler?: (args: string[]) => Promise<any>;
  args?: { description: string }[];
  subcommands?: CommandConfig;
}

export interface CitadelProps {
  commands?: CommandConfig;
  className?: string;
}

export type CursorStyle = {
  type: 'blink' | 'spin' | 'solid';
  character?: string;
  speed?: number;  // in milliseconds
}

export interface OutputItem {
  command: string;
  response: Record<string, unknown>;
}