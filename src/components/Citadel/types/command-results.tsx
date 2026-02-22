import React from 'react';

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

  abstract render(): React.ReactNode;
}

export class JsonCommandResult extends CommandResult {
  constructor(
    public readonly data: unknown,
    timestamp?: number
  ) {
    super(timestamp);
  }

  render(): React.ReactNode {
    return (
      <pre className="citadel-result-json">
        {JSON.stringify(this.data, null, 2)}
      </pre>
    );
  }
}

export class TextCommandResult extends CommandResult {
  constructor(
    public readonly text: string,
    timestamp?: number
  ) {
    super(timestamp);
  }

  render(): React.ReactNode {
    return (
      <div className="citadel-result-text">{this.text}</div>
    );
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

  render(): React.ReactNode {
    return (
      <div className="citadel-result-text citadel-result-boolean">
        {this.value ? this.trueText : this.falseText}
      </div>
    );
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

  render(): React.ReactNode {
    return <div className="citadel-result-error">{this.error}</div>;
  }
}

export class PendingCommandResult extends CommandResult {
  render(): React.ReactNode {
    return <div className="citadel-result-pending">...</div>;
  }
}

export class ImageCommandResult extends CommandResult {
  constructor(
    public readonly imageUrl: string,
    public readonly altText: string = '',
    timestamp?: number
  ) {
    super(timestamp);
  }

  render(): React.ReactNode {
    return (
      <div className="citadel-result-image-wrap">
        <img
          src={this.imageUrl}
          alt={this.altText}
          className="citadel-result-image"
        />
      </div>
    );
  }
}
