export class CommandExecutionError extends Error {
  constructor(message, commandPath, originalError) {
    super(message);
    this.name = 'CommandExecutionError';
    this.commandPath = commandPath;
    this.originalError = originalError;
  }
}