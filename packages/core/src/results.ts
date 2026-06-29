/**
 * Framework-agnostic command result types.
 *
 * Part of the Citadel core: result *data* + execution status, with no React or
 * DOM dependency. Rendering lives in the front-end adapters
 * (`components/renderResult.tsx` for the web). Custom result subclasses may
 * still provide their own `render()`, which the web renderer calls as an
 * extension seam. See CORE_EXTRACTION_DESIGN.md.
 */

export enum CommandStatus {
  Pending = 'pending',
  Success = 'success',
  Failure = 'failure',
  Timeout = 'timeout'
}

export abstract class CommandResult {
  private _status: CommandStatus = CommandStatus.Pending;

  constructor(
    public readonly timestamp: number = Date.now()
  ) {}

  get status(): CommandStatus {
    return this._status;
  }

  markSuccess(): void {
    this._status = CommandStatus.Success;
  }

  markFailure(): void {
    this._status = CommandStatus.Failure;
  }

  markTimeout(): void {
    this._status = CommandStatus.Timeout;
  }
}

export class JsonCommandResult extends CommandResult {
  constructor(
    public readonly data: unknown,
    timestamp?: number
  ) {
    super(timestamp);
  }
}

export class TextCommandResult extends CommandResult {
  constructor(
    public readonly text: string,
    timestamp?: number
  ) {
    super(timestamp);
  }
}

export class BooleanCommandResult extends CommandResult {
  constructor(
    public readonly value: boolean,
    public readonly trueText: string = 'true',
    public readonly falseText: string = 'false',
    timestamp?: number
  ) {
    super(timestamp);
  }
}

export class ErrorCommandResult extends CommandResult {
  constructor(
    public readonly error: string,
    timestamp?: number
  ) {
    super(timestamp);
    this.markFailure();
  }
}

export class PendingCommandResult extends CommandResult {}

export class ImageCommandResult extends CommandResult {
  constructor(
    public readonly imageUrl: string,
    public readonly altText: string = '',
    timestamp?: number
  ) {
    super(timestamp);
  }
}
