import { Command, CommandArg, CommandResponse } from "./command";

export interface CitadelState {
  isOpen: boolean;
  isClosing: boolean;
  commandStack: string[];
  currentArg: CommandArg | null;
  input: string;
  available: Command[];
  output: OutputItem[];
  isLoading: boolean;
  inputValidation: InputValidation;
}

export interface InputValidation {
  isValid: boolean;
  message?: string;
}

export interface OutputItem {
  command: string;
  response: CommandResponse;
  timestamp?: number;
}
