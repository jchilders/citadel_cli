export interface CommandArg {
  name: string;
  description: string;
}

export interface CommandBase {
  name: string;
  description: string;
  args?: CommandArg[];
  handler?: (args: string[]) => Promise<any>;
}

export interface Command extends CommandBase {
  subcommands?: CommandBase[];
}

export interface InputState {
  commandStack: string[];
  currentInput: string;
  isEnteringArg: boolean;
  availableCommands: Command[];
  validation: {
    isValid: boolean;
    message?: string;
  };
}

export interface CommandInputActions {
  setCommandStack: (stack: string[]) => void;
  setCurrentInput: (input: string) => void;
  setIsEnteringArg: (isEntering: boolean) => void;
  setAvailableCommands: (commands: Command[]) => void;
  setValidation: (validation: { isValid: boolean; message?: string }) => void;
  executeCommand: (stack: string[], args?: string[]) => Promise<void>;
}
