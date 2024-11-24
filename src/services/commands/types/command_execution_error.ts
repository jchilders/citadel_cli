export class CommandExecutionError extends Error {
  public readonly commandPath: string;
  public readonly originalError: Error;

  constructor(message: string, commandPath: string, originalError: Error) {
    super(message);
    this.name = 'CommandExecutionError';
    this.commandPath = commandPath;
    this.originalError = originalError;
  }
}