import React from 'react';

export type CommandStatus = 'pending' | 'success' | 'failure' | 'timeout';

export abstract class BaseCommandResult {
  private _status: CommandStatus = 'pending';
  
  constructor(
    public readonly timestamp: number = Date.now()
  ) {}

  get status(): CommandStatus {
    return this._status;
  }

  markSuccess(): void {
    this._status = 'success';
  }

  markFailure(): void {
    this._status = 'failure';
  }

  markTimeout(): void {
    this._status = 'timeout';
  }

  abstract render(): React.ReactNode;
}

export class JsonCommandResult extends BaseCommandResult {
  constructor(
    public readonly data: any,
    timestamp?: number
  ) {
    super(timestamp);
  }

  render(): React.ReactNode {
    return (
      <pre className="text-gray-200">
        {JSON.stringify(this.data, null, 2)}
      </pre>
    );
  }
}

export class TextCommandResult extends BaseCommandResult {
  constructor(
    public readonly text: string,
    timestamp?: number
  ) {
    super(timestamp);
  }

  render(): React.ReactNode {
    return (
      <div className="text-gray-200 whitespace-pre font-mono">{this.text}</div>
    );
  }
}

export class ErrorCommandResult extends BaseCommandResult {
  constructor(
    public readonly error: string,
    timestamp?: number
  ) {
    super(timestamp);
    this.markFailure();
  }

  render(): React.ReactNode {
    return <div className="mt-1 text-red-400">{this.error}</div>;
  }
}

export class PendingCommandResult extends BaseCommandResult {
  render(): React.ReactNode {
    return <div className="text-gray-400">...</div>;
  }
}
