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
  Streaming = 'streaming',
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

  markStreaming(): void {
    this._status = CommandStatus.Streaming;
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

/**
 * Handle passed to a {@link StreamProducer}. The producer pushes lines of text
 * over time (like `tail -f`) and signals completion.
 */
export interface StreamHandle {
  /** Append text. Multi-line text is split into separate lines. */
  push(text: string): void;
  /** Finish the stream successfully — no more output. */
  close(): void;
  /** Append an error message and finish the stream as failed. */
  fail(message: string): void;
  /** True once the stream has ended (closed, failed, or cancelled). */
  readonly closed: boolean;
}

export interface StreamOptions {
  /**
   * Maximum number of lines retained (scrollback cap). Older lines are dropped
   * once exceeded. Defaults to 500.
   */
  maxLines?: number;
}

/**
 * Produces a stream of text. Receives a {@link StreamHandle} to push lines and
 * signal completion, and may return a cleanup function that runs when the
 * stream is cancelled or closed (e.g. to `clearInterval` or close a socket).
 */
export type StreamProducer = (handle: StreamHandle) => void | (() => void);

/**
 * A live, append-only text stream (`tail -f`). Unlike the other result types it
 * has no final value: the front-ends call {@link start} once when they mount
 * it, render {@link lines} as they accumulate, {@link subscribe} to re-render on
 * each change, and {@link cancel} to stop it. Status is `Streaming` until it
 * ends (`Success` on close/cancel, `Failure` on fail).
 */
export class StreamCommandResult extends CommandResult {
  readonly maxLines: number;
  private readonly _lines: string[] = [];
  private _dropped = 0;
  private readonly listeners = new Set<() => void>();
  private cleanup?: () => void;
  private _started = false;
  private _ended = false;

  constructor(
    private readonly producer: StreamProducer,
    options: StreamOptions = {},
    timestamp?: number
  ) {
    super(timestamp);
    this.maxLines = options.maxLines ?? 500;
  }

  /** Accumulated lines, capped at {@link maxLines} (oldest dropped first). */
  get lines(): readonly string[] {
    return this._lines;
  }

  /** How many lines have been dropped by the {@link maxLines} cap. */
  get droppedCount(): number {
    return this._dropped;
  }

  /** True once the stream has ended (closed, failed, or cancelled). */
  get ended(): boolean {
    return this._ended;
  }

  /**
   * Begin producing. Idempotent — the front-end calls this once when it first
   * renders the result. Sets status to Streaming and invokes the producer.
   */
  start(): void {
    if (this._started) return;
    this._started = true;
    this.markStreaming();

    const handle: StreamHandle = {
      push: (text: string) => this.appendLines(text),
      close: () => this.end(CommandStatus.Success),
      fail: (message: string) => {
        this.appendLines(message);
        this.end(CommandStatus.Failure);
      },
      closed: false,
    };
    // Make `closed` reflect live state. An arrow getter captures `this`
    // lexically (no `this` aliasing).
    Object.defineProperty(handle, 'closed', { get: () => this._ended });

    try {
      const cleanup = this.producer(handle);
      if (typeof cleanup === 'function') {
        this.cleanup = cleanup;
        // If the producer finished synchronously, run cleanup now.
        if (this._ended) this.runCleanup();
      }
    } catch (error) {
      handle.fail(error instanceof Error ? error.message : 'Stream error');
    }
  }

  /** Subscribe to changes (push / end). Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Stop the stream and run its cleanup. Ends as Success. Bound to the instance
   * so it can be passed directly as an event handler / detached callback.
   */
  readonly cancel = (): void => {
    this.end(CommandStatus.Success);
  };

  private appendLines(text: string): void {
    if (this._ended) return;
    for (const line of text.split('\n')) {
      this._lines.push(line);
    }
    if (this._lines.length > this.maxLines) {
      const overflow = this._lines.length - this.maxLines;
      this._lines.splice(0, overflow);
      this._dropped += overflow;
    }
    this.emit();
  }

  private end(status: CommandStatus): void {
    if (this._ended) return;
    this._ended = true;
    if (status === CommandStatus.Failure) {
      this.markFailure();
    } else {
      this.markSuccess();
    }
    this.runCleanup();
    this.emit();
  }

  private runCleanup(): void {
    const cleanup = this.cleanup;
    this.cleanup = undefined;
    if (cleanup) cleanup();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
