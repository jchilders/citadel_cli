export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface CommandValidationStrategy {
  validate(input: string, availableCommands: string[]): ValidationResult;
}

export class DefaultCommandValidationStrategy implements CommandValidationStrategy {
  validate(input: string, availableCommands: string[]): ValidationResult {
    // Only allow characters that could potentially match available commands
    const validPrefix = availableCommands.some(cmd => 
      cmd.toLowerCase().startsWith(input.toLowerCase())
    );

    return {
      isValid: validPrefix,
      message: validPrefix ? undefined : 'No matching commands'
    };
  }
}