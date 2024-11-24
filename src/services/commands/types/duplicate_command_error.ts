export class DuplicateCommandError extends Error {
  constructor(path: string) {
    super(`Duplicate command path: ${path}`);
    this.name = 'DuplicateCommandError';
  }
}