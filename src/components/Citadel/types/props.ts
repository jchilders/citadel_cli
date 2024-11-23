import { CommandValidationStrategy } from "../validation/command_validation_strategy";
import { CommandConfig } from "./command";

export interface CitadelProps {
  commands?: CommandConfig;
  className?: string;
  validationStrategy?: CommandValidationStrategy;
  theme?: CitadelTheme;
}

export interface CitadelTheme {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
}