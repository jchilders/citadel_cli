export interface Command {
  name: string;
  description: string;
  handler?: CommandHandler;
  args?: CommandArg[];
  subcommands?: Command[];
}

export interface CommandRegistry {
  [key: string]: Command;
}

export interface CommandArg {
  name: string;
  description: string;
  required?: boolean;
}

export type CommandHandler = (args: string[]) => Promise<CommandResponse>;

export interface CommandResponse {
  [key: string]: unknown;
}