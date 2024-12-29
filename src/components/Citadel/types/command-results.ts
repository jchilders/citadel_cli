/**
 * Base class for command execution results
 */
export abstract class BaseCommandResult {
  private status: CommandStatus = CommandStatus.Pending;
  public json?: any;

  constructor(public readonly type: string, public readonly value: any) {}

  markSuccess() {
    this.status = CommandStatus.Success;
  }

  markError() {
    this.status = CommandStatus.Error;
  }

  markTimeout() {
    this.status = CommandStatus.Timeout;
  }

  getStatus(): CommandStatus {
    return this.status;
  }
}

/**
 * A type alias for BaseCommandResult to maintain compatibility
 */
export type CommandResult = BaseCommandResult;

/**
 * Result containing text output
 */
export class TextCommandResult extends BaseCommandResult {
  constructor(public readonly value: string) {
    super('text', value);
  }
}

/**
 * Result containing JSON data
 */
export class JsonCommandResult<T = any> extends BaseCommandResult {
  constructor(public readonly value: T) {
    super('json', value);
  }
}

/**
 * Result containing an image
 */
export class ImageCommandResult extends BaseCommandResult {
  constructor(public readonly value: { src: string; alt?: string }) {
    super('image', value);
  }
}

/**
 * Result containing HTML content
 */
export class HtmlCommandResult extends BaseCommandResult {
  constructor(public readonly value: string) {
    super('html', value);
  }
}

/**
 * Result containing markdown content
 */
export class MarkdownCommandResult extends BaseCommandResult {
  constructor(public readonly value: string) {
    super('markdown', value);
  }
}

/**
 * Result containing tabular data
 */
export class TableCommandResult extends BaseCommandResult {
  constructor(public readonly value: {
    headers: string[];
    rows: any[][];
  }) {
    super('table', value);
  }
}

/**
 * Result for a command that is still executing
 */
export class PendingCommandResult extends BaseCommandResult {
  constructor() {
    super('pending', null);
  }
}

/**
 * Result for a command that encountered an error
 */
export class ErrorCommandResult extends BaseCommandResult {
  constructor(public readonly message: string) {
    super('error', { message });
    this.markError();
  }
}

/**
 * Command status
 */
export enum CommandStatus {
  Pending = 'pending',
  Running = 'running',
  Success = 'success',
  Error = 'error',
  Cancelled = 'cancelled',
  Timeout = 'timeout'
}

/**
 * Status of a command result
 */
export type CommandResultStatus = CommandStatus;

/**
 * Command result type
 */
export type CommandResultType = 
  | 'text'
  | 'json'
  | 'image'
  | 'html'
  | 'markdown'
  | 'table'
  | 'pending'
  | 'error';
