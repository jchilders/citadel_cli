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

export interface OutputItem {
  command: string;
  response: Record<string, unknown>;
}

export type CursorStyle = {
  type: 'blink' | 'spin' | 'solid' | 'bbs';
  character?: string;
  speed?: number;  // in milliseconds
}

export const DEFAULT_CURSOR_CONFIGS = {
  blink: {
    character: '▋',
    speed: 530
  },
  spin: {
    character: '⠋', // Not actually used, but included for consistency
    speed: 120
  },
  solid: {
    character: '▋',
    speed: 0 // Not used for solid
  },
  bbs: {
    character: "|",
    speed: 120
  } 
} as const;